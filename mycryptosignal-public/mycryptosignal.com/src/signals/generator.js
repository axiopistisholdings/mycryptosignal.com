// Layer A: Deterministic signal generation (no AI)
// Analyzes stored snapshots and produces structured trading signals

export class SignalGenerator {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get recent market snapshots for a coin (last 7 days)
   */
  async getMarketHistory(coinId, days = 7) {
    const cutoff = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    const { results } = await this.db.prepare(
      `SELECT * FROM market_snapshots 
       WHERE coin_id = ? AND timestamp >= ?
       ORDER BY timestamp DESC`
    ).bind(coinId, cutoff).all();

    return results;
  }

  /**
   * Get recent on-chain snapshots for a coin (last 7 days)
   */
  async getOnchainHistory(coinId, days = 7) {
    const cutoff = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    const { results } = await this.db.prepare(
      `SELECT * FROM onchain_snapshots 
       WHERE coin_id = ? AND timestamp >= ?
       ORDER BY timestamp DESC`
    ).bind(coinId, cutoff).all();

    return results;
  }

  /**
   * Calculate momentum score based on price trends
   */
  calculateMomentum(snapshots) {
    if (snapshots.length < 2) return 0;

    const latest = snapshots[0];
    const oldest = snapshots[snapshots.length - 1];
    
    // Price momentum (weighted by recency)
    const priceChange = ((latest.price - oldest.price) / oldest.price) * 100;
    
    // Volume trend
    const avgVolumeRecent = snapshots.slice(0, 3).reduce((sum, s) => sum + s.volume_24h, 0) / 3;
    const avgVolumeOld = snapshots.slice(-3).reduce((sum, s) => sum + s.volume_24h, 0) / 3;
    const volumeTrend = avgVolumeOld > 0 ? ((avgVolumeRecent - avgVolumeOld) / avgVolumeOld) * 100 : 0;

    // Combined momentum score (-100 to +100)
    return (priceChange * 0.7) + (volumeTrend * 0.3);
  }

  /**
   * Calculate volatility (risk indicator)
   */
  calculateVolatility(snapshots) {
    if (snapshots.length < 3) return 0;

    const prices = snapshots.map(s => s.price);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    // Return coefficient of variation (%)
    return (stdDev / mean) * 100;
  }

  /**
   * Detect trend direction
   */
  detectTrend(snapshots) {
    if (snapshots.length < 5) return 'NEUTRAL';

    const prices = snapshots.map(s => s.price);
    let upMoves = 0;
    let downMoves = 0;

    for (let i = 0; i < prices.length - 1; i++) {
      if (prices[i] > prices[i + 1]) upMoves++;
      else downMoves++;
    }

    if (upMoves > downMoves * 1.5) return 'UP';
    if (downMoves > upMoves * 1.5) return 'DOWN';
    return 'NEUTRAL';
  }

  /**
   * Calculate on-chain activity score
   */
  calculateOnchainScore(snapshots) {
    if (snapshots.length < 2) return 0;

    const latest = snapshots[0];
    const oldest = snapshots[snapshots.length - 1];

    // Transaction growth
    const txGrowth = oldest.transaction_count > 0 
      ? ((latest.transaction_count - oldest.transaction_count) / oldest.transaction_count) * 100
      : 0;

    // Network utilization trend
    const utilRecent = snapshots.slice(0, 3).reduce((sum, s) => sum + s.network_utilization, 0) / 3;
    const utilOld = snapshots.slice(-3).reduce((sum, s) => sum + s.network_utilization, 0) / 3;
    const utilTrend = utilOld > 0 ? ((utilRecent - utilOld) / utilOld) * 100 : 0;

    return (txGrowth * 0.6) + (utilTrend * 0.4);
  }

  /**
   * Generate signal for a single coin (deterministic Layer A)
   */
  async generateSignal(coinId) {
    try {
      // Fetch data
      const marketHistory = await this.getMarketHistory(coinId, 7);
      const onchainHistory = await this.getOnchainHistory(coinId, 7);

      if (marketHistory.length < 3) {
        return {
          action: 'HOLD',
          confidence: 0,
          explanation: 'Insufficient data',
          metrics: null
        };
      }

      // Calculate metrics
      const momentum = this.calculateMomentum(marketHistory);
      const volatility = this.calculateVolatility(marketHistory);
      const trend = this.detectTrend(marketHistory);
      const onchainScore = onchainHistory.length > 0 
        ? this.calculateOnchainScore(onchainHistory) 
        : 0;

      // Decision logic
      let action = 'HOLD';
      let confidence = 50;

      // BUY conditions
      if (momentum > 5 && trend === 'UP' && volatility < 15 && onchainScore > 0) {
        action = 'BUY';
        confidence = Math.min(95, 60 + (momentum * 2) + (onchainScore * 0.5));
      }
      // Strong BUY
      else if (momentum > 10 && trend === 'UP' && onchainScore > 10) {
        action = 'BUY';
        confidence = Math.min(95, 70 + (momentum * 1.5));
      }
      // RISK conditions
      else if (momentum < -10 || (volatility > 20 && trend === 'DOWN')) {
        action = 'RISK';
        confidence = Math.min(95, 60 + Math.abs(momentum));
      }
      else if (volatility > 25 || onchainScore < -15) {
        action = 'RISK';
        confidence = Math.min(90, 55 + (volatility * 1.5));
      }
      // HOLD (neutral)
      else {
        confidence = 50 + Math.abs(momentum);
      }

      const metrics = {
        momentum: momentum.toFixed(2),
        volatility: volatility.toFixed(2),
        trend,
        onchainScore: onchainScore.toFixed(2),
        priceChange24h: marketHistory[0].price_change_24h?.toFixed(2) || 0,
        priceChange7d: marketHistory[0].price_change_7d?.toFixed(2) || 0
      };

      return {
        action,
        confidence: Math.round(confidence),
        metrics,
        explanation: this.generateExplanation(action, metrics)
      };

    } catch (error) {
      console.error(`Signal generation error for ${coinId}:`, error);
      return {
        action: 'HOLD',
        confidence: 0,
        explanation: 'Error generating signal',
        metrics: null
      };
    }
  }

  /**
   * Generate human-readable explanation
   */
  generateExplanation(action, metrics) {
    const { momentum, volatility, trend, onchainScore } = metrics;
    
    if (action === 'BUY') {
      return `Positive momentum (${momentum}%), uptrend detected, moderate volatility (${volatility}%), on-chain activity ${onchainScore > 0 ? 'increasing' : 'stable'}.`;
    } else if (action === 'RISK') {
      return `High risk: ${momentum < 0 ? `negative momentum (${momentum}%)` : ''} ${volatility > 20 ? `elevated volatility (${volatility}%)` : ''} ${trend === 'DOWN' ? 'downtrend' : ''}.`;
    } else {
      return `Neutral outlook: ${trend} trend, ${volatility}% volatility, ${momentum}% momentum.`;
    }
  }

  /**
   * Generate signals for all tracked coins
   */
  async generateAllSignals() {
    const { TRACKED_COINS } = await import('../data/coins.js');
    const timestamp = Math.floor(Date.now() / 1000);
    const signalDate = new Date().toISOString().split('T')[0];

    const signals = [];
    
    for (const coin of TRACKED_COINS) {
      const signal = await this.generateSignal(coin.id);
      
      // Store in database
      await this.db.prepare(
        `INSERT INTO signals 
         (coin_id, timestamp, signal_date, action, confidence, explanation, layer_a_data)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        coin.id,
        timestamp,
        signalDate,
        signal.action,
        signal.confidence,
        signal.explanation,
        JSON.stringify(signal.metrics)
      ).run();

      signals.push({
        coin_id: coin.id,
        symbol: coin.symbol,
        ...signal
      });
    }

    return signals;
  }
}
