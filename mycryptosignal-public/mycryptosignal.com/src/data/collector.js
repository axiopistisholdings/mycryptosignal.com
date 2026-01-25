// Data collection coordinator - runs every 30 minutes
import { CoinGeckoService } from '../services/coingecko.js';
import { AlchemyService } from '../services/alchemy.js';
import { InfuraService } from '../services/infura.js';
import { TRACKED_COINS, getAlchemyCoins, getInfuraCoins } from '../data/coins.js';

export class DataCollector {
  constructor(env) {
    this.db = env.DB;
    this.coingecko = new CoinGeckoService(env.COINGECKO_API_KEY);
    this.alchemy = new AlchemyService(env.ALCHEMY_API_KEY);
    this.infura = new InfuraService(env.INFURA_API_KEY);
  }

  /**
   * Collect market data from CoinGecko for all 60 coins
   */
  async collectMarketData() {
    try {
      const coinIds = TRACKED_COINS.map(c => c.id);
      const marketData = await this.coingecko.getAllCoinsMarketData(coinIds);
      
      // Store in database
      for (const data of marketData) {
        await this.db.prepare(
          `INSERT INTO market_snapshots 
           (coin_id, timestamp, price, market_cap, volume_24h, price_change_24h, price_change_7d, price_change_30d)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          data.coin_id,
          data.timestamp,
          data.price,
          data.market_cap,
          data.volume_24h,
          data.price_change_24h,
          data.price_change_7d,
          data.price_change_30d
        ).run();
      }

      return { success: true, count: marketData.length };
    } catch (error) {
      console.error('Market data collection error:', error);
      await this.logError('market_data_collection', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Collect on-chain data from Alchemy for assigned coins
   */
  async collectAlchemyData() {
    try {
      const coins = getAlchemyCoins();
      const onchainData = await this.alchemy.getAllCoinsMetrics(coins);
      
      // Store in database
      for (const data of onchainData) {
        if (!data) continue;
        
        await this.db.prepare(
          `INSERT INTO onchain_snapshots 
           (coin_id, timestamp, transaction_count, active_addresses, gas_used, block_height, network_utilization)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          data.coin_id,
          data.timestamp,
          data.transaction_count || 0,
          data.active_addresses || 0,
          data.gas_used || 0,
          data.block_height || 0,
          data.network_utilization || 0
        ).run();
      }

      return { success: true, count: onchainData.length };
    } catch (error) {
      console.error('Alchemy data collection error:', error);
      await this.logError('alchemy_data_collection', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Collect on-chain data from Infura for assigned coins
   */
  async collectInfuraData() {
    try {
      const coins = getInfuraCoins();
      const onchainData = await this.infura.getAllCoinsMetrics(coins);
      
      // Store in database
      for (const data of onchainData) {
        if (!data) continue;
        
        await this.db.prepare(
          `INSERT INTO onchain_snapshots 
           (coin_id, timestamp, transaction_count, active_addresses, gas_used, block_height, network_utilization)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          data.coin_id,
          data.timestamp,
          data.transaction_count || 0,
          data.active_addresses || 0,
          data.gas_used || 0,
          data.block_height || 0,
          data.network_utilization || 0
        ).run();
      }

      return { success: true, count: onchainData.length };
    } catch (error) {
      console.error('Infura data collection error:', error);
      await this.logError('infura_data_collection', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run complete data collection cycle (all sources)
   * Sequential execution with rate limiting to respect free tiers:
   * - CoinGecko: 1 batch request for all 60 coins (~1 second)
   * - Alchemy: 30 coins with 2s delays (~60 seconds)
   * - Infura: 30 coins with 500ms delays (~15 seconds)
   * Total time: ~76 seconds (well within 30-minute window)
   */
  async collectAll() {
    const startTime = Date.now();
    
    console.log('Starting sequential data collection with rate limiting...');
    
    // 1. Collect CoinGecko data first (single batch request)
    console.log('[1/3] Collecting CoinGecko market data (batch)...');
    const marketResult = await this.collectMarketData();
    console.log(`CoinGecko complete: ${marketResult.count} coins`);
    
    // 2. Collect Alchemy data (sequential with 2s delays)
    console.log('[2/3] Collecting Alchemy on-chain data (2s delays)...');
    const alchemyResult = await this.collectAlchemyData();
    console.log(`Alchemy complete: ${alchemyResult.count} coins`);
    
    // 3. Collect Infura data (sequential with 500ms delays)
    console.log('[3/3] Collecting Infura on-chain data (500ms delays)...');
    const infuraResult = await this.collectInfuraData();
    console.log(`Infura complete: ${infuraResult.count} coins`);

    const duration = Date.now() - startTime;
    const durationSeconds = Math.round(duration / 1000);
    
    console.log(`Data collection complete in ${durationSeconds}s`);
    
    await this.logInfo('data_collection_complete', {
      duration_seconds: durationSeconds,
      market: marketResult,
      alchemy: alchemyResult,
      infura: infuraResult
    });

    return {
      success: marketResult.success && alchemyResult.success && infuraResult.success,
      duration_seconds: durationSeconds,
      results: { marketResult, alchemyResult, infuraResult }
    };
  }

  /**
   * Log system events
   */
  async logInfo(type, data) {
    await this.db.prepare(
      `INSERT INTO system_logs (log_type, message, metadata) VALUES (?, ?, ?)`
    ).bind(type, 'success', JSON.stringify(data)).run();
  }

  async logError(type, message) {
    await this.db.prepare(
      `INSERT INTO system_logs (log_type, message) VALUES (?, ?)`
    ).bind(type, message).run();
  }
}
