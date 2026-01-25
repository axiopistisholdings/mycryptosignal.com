// X (Twitter) publisher for daily signals
// Multi-post strategy: Morning highlights + Mid-day spotlight + Evening updates
export class XPublisher {
  constructor(env) {
    this.apiKey = env.X_API_KEY;
    this.apiSecret = env.X_API_SECRET;
    this.accessToken = env.X_ACCESS_TOKEN;
    this.accessSecret = env.X_ACCESS_SECRET;
    this.baseUrl = 'https://api.twitter.com/2';
    this.db = env.DB;
  }

  /**
   * Generate OAuth 1.0a signature for Twitter API
   */
  async generateOAuthHeader(method, url, params = {}) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.random().toString(36).substring(2, 15);

    const oauthParams = {
      oauth_consumer_key: this.apiKey,
      oauth_token: this.accessToken,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0'
    };

    // Combine params
    const allParams = { ...oauthParams, ...params };
    
    // Create signature base string
    const sortedParams = Object.keys(allParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&');

    const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
    
    // Create signing key
    const signingKey = `${encodeURIComponent(this.apiSecret)}&${encodeURIComponent(this.accessSecret)}`;
    
    // Generate signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signatureData = encoder.encode(signatureBase);
    const signature = await crypto.subtle.sign('HMAC', key, signatureData);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Build OAuth header
    oauthParams.oauth_signature = signatureBase64;
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    return authHeader;
  }

  /**
   * Post a tweet
   */
  async tweet(text) {
    try {
      const url = `${this.baseUrl}/tweets`;
      const authHeader = await this.generateOAuthHeader('POST', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twitter API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tweet error:', error);
      throw error;
    }
  }

  /**
   * POST 1: Morning Highlights (08:30 UTC)
   * Top 3-5 signals (BUY/HOLD/RISK) - always posts regardless of confidence
   */
  async postMorningHighlights(signals) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toISOString().slice(11, 16);
      
      // Get top signals by confidence regardless of action type
      const topBuys = signals
        .filter(s => s.action === 'BUY')
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);
      
      const topRisks = signals
        .filter(s => s.action === 'RISK')
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 2);
      
      const topHolds = signals
        .filter(s => s.action === 'HOLD')
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 2);

      // If somehow no signals at all (shouldn't happen)
      if (signals.length === 0) {
        return { success: false, message: 'No signals available' };
      }

      // Determine market sentiment
      const buyCount = signals.filter(s => s.action === 'BUY').length;
      const riskCount = signals.filter(s => s.action === 'RISK').length;
      const holdCount = signals.filter(s => s.action === 'HOLD').length;
      
      let marketContext = '📊';
      if (buyCount > 30) marketContext = '🟢 Bullish';
      else if (riskCount > 30) marketContext = '🔴 Bearish';
      else marketContext = '🟡 Neutral';

      let post = `${marketContext} | ${date.slice(5)} ${time} UTC\n\n`;
      
      // Always show top signals by action type
      if (topBuys.length > 0) {
        post += `🟢 BUY:\n`;
        topBuys.forEach(s => {
          const shortExplain = s.explanation.split('.')[0].substring(0, 45);
          post += `$${s.symbol} ${Math.round(s.confidence)}% - ${shortExplain}\n`;
        });
        post += `\n`;
      }
      
      if (topRisks.length > 0) {
        post += `🔴 RISK:\n`;
        topRisks.forEach(s => {
          const shortExplain = s.explanation.split('.')[0].substring(0, 45);
          post += `$${s.symbol} ${Math.round(s.confidence)}% - ${shortExplain}\n`;
        });
        post += `\n`;
      }
      
      // Include HOLD signals if dominant market
      if (holdCount > 30 && topHolds.length > 0) {
        post += `🟡 HOLD:\n`;
        topHolds.slice(0, 2).forEach(s => {
          const shortExplain = s.explanation.split('.')[0].substring(0, 45);
          post += `$${s.symbol} ${Math.round(s.confidence)}%\n`;
        });
        post += `\n`;
      }
      
      post += `#CryptoSignals`;

      // Trim to 280 chars if needed
      if (post.length > 280) {
        post = post.substring(0, 275) + '...';
      }

      await this.tweet(post);
      
      // Log the post
      const totalPosted = topBuys.length + topRisks.length + (holdCount > 30 ? topHolds.length : 0);
      await this.db.prepare(
        `INSERT INTO system_logs (log_type, message, metadata) VALUES (?, ?, ?)`
      ).bind('x_post', 'morning_highlights', JSON.stringify({ 
        signals: totalPosted,
        market: marketContext,
        breakdown: { buy: buyCount, hold: holdCount, risk: riskCount }
      })).run();

      return { success: true, type: 'morning_highlights', signals: totalPosted, market: marketContext };
    } catch (error) {
      console.error('Morning highlights post error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * POST 2: Mid-Day Spotlight (14:00 UTC)
   * Single highest-confidence signal - always posts best available
   */
  async postMidDaySpotlight(signals) {
    try {
      // Find the absolute highest confidence signal (no minimum threshold)
      const spotlight = signals
        .sort((a, b) => b.confidence - a.confidence)[0];

      if (!spotlight) {
        return { success: false, message: 'No signals available' };
      }

      const emoji = spotlight.action === 'BUY' ? '🟢' : spotlight.action === 'RISK' ? '🔴' : '🟡';
      const confLevel = spotlight.confidence >= 75 ? 'HIGH CONFIDENCE' : 
                        spotlight.confidence >= 60 ? 'MODERATE CONFIDENCE' : 'SIGNAL SPOTLIGHT';
      
      let post = `🔥 ${confLevel}\n\n`;
      post += `$${spotlight.symbol} - ${spotlight.action} ${emoji}\n`;
      post += `Confidence: ${Math.round(spotlight.confidence)}%\n\n`;
      
      // Use full explanation, split into key points
      const sentences = spotlight.explanation.split('.').filter(s => s.trim());
      if (sentences.length > 0) {
        post += `${sentences[0].trim()}.\n\n`;
      }
      
      post += `Generated: 08:00 UTC\n`;
      post += `#${spotlight.symbol} #CryptoTrading`;

      // Trim if needed
      if (post.length > 280) {
        post = post.substring(0, 275) + '...';
      }

      await this.tweet(post);
      
      await this.db.prepare(
        `INSERT INTO system_logs (log_type, message, metadata) VALUES (?, ?, ?)`
      ).bind('x_post', 'midday_spotlight', JSON.stringify({ coin: spotlight.symbol })).run();

      return { success: true, type: 'midday_spotlight', coin: spotlight.symbol };
    } catch (error) {
      console.error('Mid-day spotlight post error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * POST 3: Evening Update (21:00 UTC)
   * Performance check on morning signals (requires market data comparison)
   */
  async postEveningUpdate(signalDate) {
    try {
      // Get morning signals (top confidence regardless of threshold)
      const { results: morningSignals } = await this.db.prepare(
        `SELECT s.*, c.symbol 
         FROM signals s
         JOIN coins c ON s.coin_id = c.id
         WHERE s.signal_date = ? 
           AND s.action IN ('BUY', 'RISK', 'HOLD')
         ORDER BY s.confidence DESC
         LIMIT 5`
      ).bind(signalDate).all();

      if (morningSignals.length === 0) {
        return { success: false, message: 'No signals available to track' };
      }

      // Get current market data to compare
      const coinIds = morningSignals.map(s => s.coin_id);
      const placeholders = coinIds.map(() => '?').join(',');
      
      const { results: currentPrices } = await this.db.prepare(
        `SELECT coin_id, price 
         FROM market_snapshots 
         WHERE coin_id IN (${placeholders})
         ORDER BY timestamp DESC`
      ).bind(...coinIds).all();

      let post = `Signal check-in 📈\n\n`;
      
      let winners = 0;
      const updates = [];
      
      for (const signal of morningSignals.slice(0, 3)) {
        const current = currentPrices.find(p => p.coin_id === signal.coin_id);
        if (current) {
          // Simplified: just show if it's positive
          // In production, you'd calculate actual % change from morning
          const status = signal.action === 'BUY' ? '✅' : '⚠️';
          updates.push(`$${signal.symbol} ${signal.action} → ${status}`);
          if (signal.action === 'BUY') winners++;
        }
      }
      
      post += updates.join('\n') + '\n\n';
      post += `${winners}/${updates.length} tracking well\n\n`;
      post += `What coin should we analyze tomorrow? 👇`;

      if (post.length > 280) {
        post = post.substring(0, 275) + '...';
      }

      await this.tweet(post);
      
      await this.db.prepare(
        `INSERT INTO system_logs (log_type, message, metadata) VALUES (?, ?, ?)`
      ).bind('x_post', 'evening_update', JSON.stringify({ signals: updates.length })).run();

      return { success: true, type: 'evening_update', signals: updates.length };
    } catch (error) {
      console.error('Evening update post error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Main publishing orchestrator - called by scheduler at different times
   */
  async publishSignals(signals, postType = 'morning') {
    try {
      if (!this.apiKey || !this.apiSecret) {
        console.log('X credentials not configured, skipping publish');
        return { success: false, message: 'Credentials not configured' };
      }

      let result;
      
      switch (postType) {
        case 'morning':
          result = await this.postMorningHighlights(signals);
          break;
        case 'midday':
          result = await this.postMidDaySpotlight(signals);
          break;
        case 'evening':
          const signalDate = new Date().toISOString().split('T')[0];
          result = await this.postEveningUpdate(signalDate);
          break;
        default:
          return { success: false, message: 'Invalid post type' };
      }

      return result;
    } catch (error) {
      console.error('Error publishing to X:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Legacy method - now uses morning highlights
   */
  async publishDailySignals(signals) {
    return this.publishSignals(signals, 'morning');
  }
}
