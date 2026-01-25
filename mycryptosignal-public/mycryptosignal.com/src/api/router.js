// API Router for B2B data access
import { TRACKED_COINS } from '../data/coins.js';

export class APIRouter {
  constructor(env) {
    this.db = env.DB;
    this.kv = env.KV;
  }

  /**
   * Get CORS headers for frontend access
   */
  getCorsHeaders() {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
      'Access-Control-Max-Age': '86400'
    };
  }

  /**
   * Handle OPTIONS preflight requests
   */
  handleOptions() {
    return new Response(null, {
      status: 204,
      headers: this.getCorsHeaders()
    });
  }

  /**
   * Validate API key and check rate limits
   * Returns key details or throws error
   */
  async validateAPIKey(apiKey) {
    if (!apiKey) {
      throw new Error('API key required');
    }

    // Hash the key for lookup
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if key exists and is active
    const { results } = await this.db.prepare(
      `SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1`
    ).bind(keyHash).all();

    if (results.length === 0) {
      throw new Error('Invalid API key');
    }

    const key = results[0];
    
    // Check monthly quota
    if (key.monthly_quota > 0 && key.current_month_usage >= key.monthly_quota) {
      throw new Error('Monthly quota exceeded');
    }
    
    // Check rate limits using KV
    await this.checkRateLimits(key);

    // Update last used
    await this.db.prepare(
      `UPDATE api_keys 
       SET last_used_at = ?, request_count = request_count + 1 
       WHERE id = ?`
    ).bind(Math.floor(Date.now() / 1000), key.id).run();

    return key;
  }

  /**
   * Check rate limits using KV for sliding windows
   */
  async checkRateLimits(key) {
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const today = new Date().toISOString().split('T')[0];
    
    // Check requests per minute (sliding window)
    const rpmKey = `ratelimit:rpm:${key.id}:${currentMinute}`;
    const currentRPM = parseInt(await this.kv.get(rpmKey) || '0');
    
    if (currentRPM >= key.rpm_limit) {
      const retryAfter = 60 - Math.floor((now % 60000) / 1000);
      throw new Error(`Rate limit exceeded: ${key.rpm_limit} requests per minute. Retry after ${retryAfter}s`);
    }
    
    // Check requests per day
    const rpdKey = `ratelimit:rpd:${key.id}:${today}`;
    const currentRPD = parseInt(await this.kv.get(rpdKey) || '0');
    
    if (currentRPD >= key.rpd_limit) {
      throw new Error(`Daily limit exceeded: ${key.rpd_limit} requests per day`);
    }
    
    // Increment counters with expiration
    await this.kv.put(rpmKey, String(currentRPM + 1), { expirationTtl: 120 }); // 2 min TTL
    await this.kv.put(rpdKey, String(currentRPD + 1), { expirationTtl: 86400 * 2 }); // 2 day TTL
  }

  /**
   * Log API usage for analytics and billing
   */
  async logUsage(key, request, responseTime, statusCode) {
    const url = new URL(request.url);
    const now = Math.floor(Date.now() / 1000);
    
    try {
      await this.db.prepare(
        `INSERT INTO api_usage_logs (
          api_key_id, endpoint, method, timestamp, 
          response_time_ms, status_code, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        key.id,
        url.pathname,
        request.method,
        now,
        responseTime,
        statusCode,
        request.headers.get('User-Agent') || 'unknown'
      ).run();
      
      // Update monthly usage counter
      await this.db.prepare(
        `UPDATE api_keys SET current_month_usage = current_month_usage + 1 WHERE id = ?`
      ).bind(key.id).run();
    } catch (error) {
      // Don't fail the request if logging fails
      console.error('Failed to log usage:', error);
    }
  }

  /**
   * Get rate limit headers for response
   */
  getRateLimitHeaders(key, currentRPM) {
    const remaining = Math.max(0, key.rpm_limit - (currentRPM || 0));
    const resetTime = Math.ceil(Date.now() / 60000) * 60;
    const quotaRemaining = key.monthly_quota > 0 
      ? Math.max(0, key.monthly_quota - key.current_month_usage)
      : -1;
    
    return {
      'X-RateLimit-Limit': String(key.rpm_limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetTime),
      'X-Quota-Limit': String(key.monthly_quota),
      'X-Quota-Remaining': quotaRemaining === -1 ? 'unlimited' : String(quotaRemaining),
      'X-Quota-Reset': String(key.quota_reset_at || 0)
    };
  }

  /**
   * Get latest market snapshots (30-min cadence)
   */
  async getLatestMarketData() {
    const { results } = await this.db.prepare(
      `SELECT m.*, c.symbol, c.name
       FROM market_snapshots m
       JOIN coins c ON m.coin_id = c.id
       WHERE m.timestamp = (
         SELECT MAX(timestamp) FROM market_snapshots WHERE coin_id = m.coin_id
       )
       ORDER BY c.symbol`
    ).all();

    return results;
  }

  /**
   * Get latest on-chain snapshots
   */
  async getLatestOnchainData() {
    const { results } = await this.db.prepare(
      `SELECT o.*, c.symbol, c.name
       FROM onchain_snapshots o
       JOIN coins c ON o.coin_id = c.id
       WHERE o.timestamp = (
         SELECT MAX(timestamp) FROM onchain_snapshots WHERE coin_id = o.coin_id
       )
       ORDER BY c.symbol`
    ).all();

    return results;
  }

  /**
   * Get latest signals (daily)
   */
  async getLatestSignals() {
    const { results } = await this.db.prepare(
      `SELECT s.*, c.symbol, c.name
       FROM signals s
       JOIN coins c ON s.coin_id = c.id
       WHERE s.signal_date = (SELECT MAX(signal_date) FROM signals)
       ORDER BY c.symbol`
    ).all();

    return results.map(s => ({
      coin_id: s.coin_id,
      symbol: s.symbol,
      name: s.name,
      action: s.action,
      confidence: s.confidence,
      explanation: s.explanation,
      signal_date: s.signal_date,
      timestamp: s.timestamp
    }));
  }

  /**
   * Get signal history for a specific coin
   */
  async getCoinSignalHistory(coinId, days = 30) {
    const cutoff = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    const { results } = await this.db.prepare(
      `SELECT * FROM signals 
       WHERE coin_id = ? AND timestamp >= ?
       ORDER BY timestamp DESC`
    ).bind(coinId, cutoff).all();

    return results;
  }

  /**
   * Handle API requests
   */
  async handleRequest(request) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    let apiKey = null;
    let statusCode = 200;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return this.handleOptions();
    }

    // Extract API key from header
    const apiKeyHeader = request.headers.get('X-API-Key');
    
    // Validate API key (except for health check)
    if (path !== '/api/health') {
      try {
        apiKey = await this.validateAPIKey(apiKeyHeader);
      } catch (error) {
        statusCode = error.message.includes('quota exceeded') || error.message.includes('limit exceeded') ? 429 : 401;
        const response = new Response(
          JSON.stringify({ error: error.message }),
          { status: statusCode, headers: { 'Content-Type': 'application/json', ...this.getCorsHeaders() } }
        );
        
        // Log failed request if we have a key
        if (apiKey) {
          await this.logUsage(apiKey, request, Date.now() - startTime, statusCode);
        }
        
        return response;
      }
    }

    // Route requests
    try {
      let responseData;
      
      switch (path) {
        case '/api/health':
          return new Response(
            JSON.stringify({ status: 'ok', timestamp: Date.now() }),
            { headers: { 'Content-Type': 'application/json', ...this.getCorsHeaders() } }
          );

        case '/api/coins':
          responseData = JSON.stringify({ coins: TRACKED_COINS });
          break;

        case '/api/market':
          const marketData = await this.getLatestMarketData();
          responseData = JSON.stringify({ 
            data: marketData, 
            count: marketData.length,
            attribution: "Data provided by MyCryptoSignal"
          });
          break;

        case '/api/onchain':
          const onchainData = await this.getLatestOnchainData();
          responseData = JSON.stringify({ 
            data: onchainData, 
            count: onchainData.length,
            attribution: "Data provided by MyCryptoSignal"
          });
          break;

        case '/api/signals':
          const signals = await this.getLatestSignals();
          responseData = JSON.stringify({ 
            signals, 
            count: signals.length,
            attribution: "Data provided by MyCryptoSignal"
          });
          break;

        case '/api/signals/history':
          const coinId = url.searchParams.get('coin_id');
          const days = parseInt(url.searchParams.get('days') || '30');
          
          if (!coinId) {
            statusCode = 400;
            responseData = JSON.stringify({ error: 'coin_id parameter required' });
            break;
          }

          const history = await this.getCoinSignalHistory(coinId, days);
          responseData = JSON.stringify({ 
            coin_id: coinId, 
            history, 
            count: history.length,
            attribution: "Data provided by MyCryptoSignal"
          });
          break;

        default:
          statusCode = 404;
          responseData = JSON.stringify({ error: 'Endpoint not found' });
          break;
      }
      
      // Build response with rate limit headers and CORS
      const headers = {
        'Content-Type': 'application/json',
        ...this.getCorsHeaders(),
        ...this.getRateLimitHeaders(apiKey, 0)
      };
      
      // Log usage
      const responseTime = Date.now() - startTime;
      await this.logUsage(apiKey, request, responseTime, statusCode);
      
      return new Response(responseData, { status: statusCode, headers });
    } catch (error) {
      console.error('API error:', error);
      statusCode = 500;
      
      // Log error
      if (apiKey) {
        await this.logUsage(apiKey, request, Date.now() - startTime, statusCode);
      }
      
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: error.message }),
        { status: statusCode, headers: { 'Content-Type': 'application/json', ...this.getCorsHeaders() } }
      );
    }
  }
}
