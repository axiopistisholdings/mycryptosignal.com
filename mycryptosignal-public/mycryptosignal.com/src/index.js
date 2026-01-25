// Main Cloudflare Worker entry point
import { DataCollector } from './data/collector.js';
import { SignalGenerator } from './signals/generator.js';
import { AIEnhancer } from './signals/ai-enhancer.js';
import { APIRouter } from './api/router.js';
import { XPublisher } from './api/x-publisher.js';
import { TRACKED_COINS } from './data/coins.js';

export default {
  /**
   * Handle scheduled triggers (cron jobs)
   * Runs every 30 minutes for data collection
   * Runs daily at specific time for signal generation
   */
  async scheduled(event, env, ctx) {
    const now = new Date();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();

    try {
      // Data collection runs every 30 minutes (at :00 and :30)
      console.log(`Scheduled task triggered at ${hour}:${minute} UTC`);
      
      // Log to database for debugging
      await env.DB.prepare(
        `INSERT INTO system_logs (log_type, message, metadata) 
         VALUES (?, ?, ?)`
      ).bind('cron_trigger', `Cron executed at ${hour}:${minute}`, JSON.stringify({ hour, minute })).run();
      
      // Check if this is a signal generation or X posting time
      // Skip data collection to avoid subrequest limit conflicts
      const isSignalGenerationTime = (hour === 8 && minute <= 5);
      const isPostingTime = (hour === 8 && minute >= 30 && minute <= 35) || 
                            (hour === 14 && minute <= 5) || 
                            (hour === 21 && minute <= 5);
      
      // Only run data collection if NOT a signal/posting time
      if (!isSignalGenerationTime && !isPostingTime) {
        const collector = new DataCollector(env);
        const collectionResult = await collector.collectAll();
        console.log('Data collection result:', collectionResult);
      } else {
        console.log('Skipping data collection - signal generation or X posting hour');
      }

      // Signal generation and publishing runs once daily at 08:00 UTC
      if (hour === 8 && minute <= 5) {
        console.log('Starting daily signal generation at 08:00 UTC...');
        
        // Generate Layer A signals
        const generator = new SignalGenerator(env.DB);
        const signals = await generator.generateAllSignals();
        console.log(`Generated ${signals.length} Layer A signals`);

        // Enhance with Layer B (AI via Cohere)
        const aiEnhancer = new AIEnhancer(env.COHERE_API_KEY);
        const signalDate = now.toISOString().split('T')[0];
        const enhancementResult = await aiEnhancer.updateSignalsWithAI(env.DB, signalDate);
        console.log('AI enhancement result:', enhancementResult);

        // Schedule morning X post for 08:30 (wait 30 minutes to ensure all signals are ready)
        // This will be caught by the next cron run at 08:30
      }

      // Morning X post at 08:30 UTC (after signal generation completes)
      if (hour === 8 && minute >= 30 && minute <= 35) {
        console.log('Posting morning highlights to X...');
        
        const xPublisher = new XPublisher(env);
        const signalDate = now.toISOString().split('T')[0];
        
        const { results: signals } = await env.DB.prepare(
          `SELECT s.*, c.symbol, c.name 
           FROM signals s
           JOIN coins c ON s.coin_id = c.id
           WHERE s.signal_date = ?`
        ).bind(signalDate).all();

        const publishResult = await xPublisher.publishSignals(signals, 'morning');
        console.log('Morning X post result:', publishResult);

        // Mark signals as published
        if (publishResult.success) {
          await env.DB.prepare(
            `UPDATE signals 
             SET published = 1, published_at = ? 
             WHERE signal_date = ? AND published = 0`
          ).bind(Math.floor(Date.now() / 1000), signalDate).run();
        }
      }

      // Mid-day spotlight post at 14:00 UTC
      if (hour === 14 && minute <= 5) {
        console.log('Posting mid-day spotlight to X...');
        
        await env.DB.prepare(
          `INSERT INTO system_logs (log_type, message, metadata) 
           VALUES (?, ?, ?)`
        ).bind('x_post_attempt', 'Attempting midday post', JSON.stringify({ hour, minute })).run();
        
        const xPublisher = new XPublisher(env);
        const signalDate = now.toISOString().split('T')[0];
        
        const { results: signals } = await env.DB.prepare(
          `SELECT s.*, c.symbol, c.name 
           FROM signals s
           JOIN coins c ON s.coin_id = c.id
           WHERE s.signal_date = ?`
        ).bind(signalDate).all();

        const publishResult = await xPublisher.publishSignals(signals, 'midday');
        console.log('Mid-day X post result:', publishResult);
        
        await env.DB.prepare(
          `INSERT INTO system_logs (log_type, message, metadata) 
           VALUES (?, ?, ?)`
        ).bind('x_post_result', 'Midday post result', JSON.stringify(publishResult)).run();
      }

      // Evening update post at 21:00 UTC
      if (hour === 21 && minute <= 5) {
        console.log('Posting evening update to X...');
        
        await env.DB.prepare(
          `INSERT INTO system_logs (log_type, message, metadata) 
           VALUES (?, ?, ?)`
        ).bind('x_post_attempt', 'Attempting evening post', JSON.stringify({ hour, minute })).run();
        
        const xPublisher = new XPublisher(env);
        const publishResult = await xPublisher.publishSignals([], 'evening');
        console.log('Evening X post result:', publishResult);
        
        await env.DB.prepare(
          `INSERT INTO system_logs (log_type, message, metadata) 
           VALUES (?, ?, ?)`
        ).bind('x_post_result', 'Evening post result', JSON.stringify(publishResult)).run();
      }

      // Monthly quota reset at 00:00 UTC on the 1st of each month
      const dayOfMonth = now.getUTCDate();
      if (dayOfMonth === 1 && hour === 0 && minute <= 5) {
        console.log('Running monthly API quota reset...');
        
        // Calculate next month's reset date
        const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextResetTimestamp = Math.floor(nextResetDate.getTime() / 1000);
        
        const resetResult = await env.DB.prepare(
          `UPDATE api_keys 
           SET current_month_usage = 0, 
               quota_reset_at = ?
           WHERE is_active = 1 AND monthly_quota > 0`
        ).bind(nextResetTimestamp).run();
        
        console.log(`Monthly quota reset complete: ${resetResult.meta.changes} keys updated`);
        
        await env.DB.prepare(
          `INSERT INTO system_logs (log_type, message, metadata) 
           VALUES (?, ?, ?)`
        ).bind('quota_reset', 'Monthly API quota reset', JSON.stringify({ 
          keysReset: resetResult.meta.changes,
          nextReset: nextResetTimestamp 
        })).run();
      }

    } catch (error) {
      console.error('Scheduled task error:', error);
      
      // Log error to database
      await env.DB.prepare(
        `INSERT INTO system_logs (log_type, message, metadata) 
         VALUES (?, ?, ?)`
      ).bind('scheduled_error', error.message, JSON.stringify({ hour, minute })).run();
    }
  },

  /**
   * Handle HTTP requests (API endpoints)
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization'
        }
      });
    }

    // Public endpoint to request API key
    if (url.pathname === '/api/request-key' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { email, projectName, useCase, website } = body;
        
        // Validate required fields
        if (!email || !projectName || !useCase) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: email, projectName, useCase' }),
            { 
              status: 400, 
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              } 
            }
          );
        }

        // Basic email validation
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return new Response(
            JSON.stringify({ error: 'Invalid email address' }),
            { 
              status: 400, 
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              } 
            }
          );
        }

        // Check for duplicate recent requests (within 24 hours)
        const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
        const { results: existing } = await env.DB.prepare(
          `SELECT id FROM api_key_requests 
           WHERE email = ? AND created_at > ? AND status = 'pending'`
        ).bind(email, oneDayAgo).all();

        if (existing.length > 0) {
          return new Response(
            JSON.stringify({ 
              error: 'You already have a pending request. Please wait 24 hours before submitting again.' 
            }),
            { 
              status: 429, 
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              } 
            }
          );
        }

        // Insert request into database
        await env.DB.prepare(
          `INSERT INTO api_key_requests (email, project_name, use_case, website) 
           VALUES (?, ?, ?, ?)`
        ).bind(email, projectName, useCase, website || null).run();

        // Log the request
        await env.DB.prepare(
          `INSERT INTO system_logs (log_type, message, metadata) 
           VALUES (?, ?, ?)`
        ).bind(
          'api_key_request', 
          'New API key request received', 
          JSON.stringify({ email, projectName })
        ).run();

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Your request has been submitted. We will review it and send you an API key within 24-48 hours.' 
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            } 
          }
        );
      } catch (error) {
        console.error('API key request error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to process request. Please try again.' }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            } 
          }
        );
      }
    }

    // Route API requests
    if (url.pathname.startsWith('/api/')) {
      const router = new APIRouter(env);
      const response = await router.handleRequest(request);
      
      // CORS headers are already set in APIRouter
      return response;
    }

    // Admin endpoint to manually trigger data collection
    if (url.pathname === '/admin/collect' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      const adminToken = env.ADMIN_TOKEN || 'change-me';
      
      if (authHeader !== `Bearer ${adminToken}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const collector = new DataCollector(env);
      const result = await collector.collectAll();
      
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Admin endpoint to manually trigger signal generation
    if (url.pathname === '/admin/generate-signals' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      const adminToken = env.ADMIN_TOKEN || 'change-me';
      
      if (authHeader !== `Bearer ${adminToken}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const generator = new SignalGenerator(env.DB);
        const signals = await generator.generateAllSignals();
        
        const aiEnhancer = new AIEnhancer(env.COHERE_API_KEY);
        const signalDate = new Date().toISOString().split('T')[0];
        const enhancementResult = await aiEnhancer.updateSignalsWithAI(env.DB, signalDate);

        return new Response(
          JSON.stringify({ 
            success: true, 
            signalsGenerated: signals.length,
            enhancement: enhancementResult 
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Admin endpoint to test X/Twitter posting
    if (url.pathname === '/admin/test-x-post' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      const adminToken = env.ADMIN_TOKEN || 'admin-token-change-me-later';
      
      if (authHeader !== `Bearer ${adminToken}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const body = await request.json().catch(() => ({}));
        const postType = body.type || 'morning';
        
        const xPublisher = new XPublisher(env);
        const signalDate = new Date().toISOString().split('T')[0];
        
        // Get latest signals
        const { results: signals } = await env.DB.prepare(
          `SELECT s.*, c.symbol, c.name 
           FROM signals s
           JOIN coins c ON s.coin_id = c.id
           WHERE s.signal_date = ?
           ORDER BY s.timestamp DESC
           LIMIT 60`
        ).bind(signalDate).all();

        if (signals.length === 0) {
          return new Response(
            JSON.stringify({ 
              error: 'No signals found for today. Run /admin/generate-signals first.' 
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const result = await xPublisher.publishSignals(signals, postType);
        
        return new Response(
          JSON.stringify({ 
            success: result.success,
            postType,
            details: result,
            signalsAvailable: signals.length
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message, stack: error.stack }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Admin endpoint to list all API keys with usage stats
    if (url.pathname === '/admin/api-keys' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      const adminToken = env.ADMIN_TOKEN || 'change-me';
      
      if (authHeader !== `Bearer ${adminToken}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const { results: keys } = await env.DB.prepare(
          `SELECT id, organization_name, contact_email, tier, company, 
                  is_active, rpm_limit, rpd_limit, monthly_quota, 
                  current_month_usage, quota_reset_at, created_at, 
                  last_used_at, request_count
           FROM api_keys
           ORDER BY created_at DESC`
        ).all();

        return new Response(
          JSON.stringify({ 
            keys, 
            total: keys.length,
            active: keys.filter(k => k.is_active).length 
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Admin endpoint to revoke an API key
    if (url.pathname.startsWith('/admin/api-keys/') && url.pathname.endsWith('/revoke') && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      const adminToken = env.ADMIN_TOKEN || 'change-me';
      
      if (authHeader !== `Bearer ${adminToken}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const keyId = parseInt(url.pathname.split('/')[3]);
        
        const result = await env.DB.prepare(
          `UPDATE api_keys SET is_active = 0 WHERE id = ?`
        ).bind(keyId).run();

        if (result.meta.changes === 0) {
          return new Response(
            JSON.stringify({ error: 'API key not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: `API key ${keyId} revoked` }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Admin endpoint to reactivate an API key
    if (url.pathname.startsWith('/admin/api-keys/') && url.pathname.endsWith('/activate') && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      const adminToken = env.ADMIN_TOKEN || 'change-me';
      
      if (authHeader !== `Bearer ${adminToken}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const keyId = parseInt(url.pathname.split('/')[3]);
        
        const result = await env.DB.prepare(
          `UPDATE api_keys SET is_active = 1 WHERE id = ?`
        ).bind(keyId).run();

        if (result.meta.changes === 0) {
          return new Response(
            JSON.stringify({ error: 'API key not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: `API key ${keyId} reactivated` }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Admin endpoint to view usage logs for a specific key
    if (url.pathname.startsWith('/admin/api-keys/') && url.pathname.endsWith('/usage') && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      const adminToken = env.ADMIN_TOKEN || 'change-me';
      
      if (authHeader !== `Bearer ${adminToken}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const keyId = parseInt(url.pathname.split('/')[3]);
        const limit = parseInt(url.searchParams.get('limit') || '100');
        
        const { results: logs } = await env.DB.prepare(
          `SELECT * FROM api_usage_logs 
           WHERE api_key_id = ? 
           ORDER BY timestamp DESC 
           LIMIT ?`
        ).bind(keyId, limit).all();

        return new Response(
          JSON.stringify({ keyId, logs, count: logs.length }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Root endpoint - basic info
    return new Response(
      JSON.stringify({
        service: 'MyCryptoSignal API',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          coins: '/api/coins',
          market: '/api/market',
          onchain: '/api/onchain',
          signals: '/api/signals',
          history: '/api/signals/history?coin_id=<id>&days=<days>'
        },
        documentation: 'https://mycryptosignal.com/docs',
        attribution: "Data provided by MyCryptoSignal"
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
};
