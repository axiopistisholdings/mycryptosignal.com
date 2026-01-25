// Alchemy API service for on-chain data (subset of 30 coins)
export class AlchemyService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Support for multiple chains via Alchemy
    this.networks = {
      ethereum: `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
      polygon: `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`,
      arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${apiKey}`,
      optimism: `https://opt-mainnet.g.alchemy.com/v2/${apiKey}`,
      solana: `https://solana-mainnet.g.alchemy.com/v2/${apiKey}`,
      base: `https://base-mainnet.g.alchemy.com/v2/${apiKey}`
    };
  }

  /**
   * Get network endpoint for a specific chain
   */
  getNetworkUrl(chain) {
    return this.networks[chain] || this.networks.ethereum;
  }

  /**
   * Fetch on-chain metrics for Ethereum-compatible chains
   */
  async getEVMMetrics(chain, tokenAddress = null) {
    try {
      const url = this.getNetworkUrl(chain);
      
      // Get latest block
      const blockResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });

      const blockData = await blockResponse.json();
      const blockHeight = parseInt(blockData.result, 16);

      // Get block details for transaction count
      const blockDetailsResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: [blockData.result, false],
          id: 2
        })
      });

      const blockDetails = await blockDetailsResponse.json();
      const block = blockDetails.result;

      return {
        timestamp: Math.floor(Date.now() / 1000),
        transaction_count: block.transactions ? block.transactions.length : 0,
        gas_used: parseInt(block.gasUsed, 16),
        block_height: blockHeight,
        network_utilization: block.gasLimit ? 
          (parseInt(block.gasUsed, 16) / parseInt(block.gasLimit, 16)) * 100 : 0
      };
    } catch (error) {
      console.error(`Alchemy ${chain} metrics error:`, error);
      return null;
    }
  }

  /**
   * Fetch on-chain metrics for Solana
   */
  async getSolanaMetrics() {
    try {
      const url = this.networks.solana;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getRecentPerformanceSamples',
          params: [1],
          id: 1
        })
      });

      const data = await response.json();
      const sample = data.result?.[0];

      return {
        timestamp: Math.floor(Date.now() / 1000),
        transaction_count: sample?.numTransactions || 0,
        block_height: sample?.slot || 0,
        network_utilization: 0 // Solana doesn't have gas in same way
      };
    } catch (error) {
      console.error('Alchemy Solana metrics error:', error);
      return null;
    }
  }

  /**
   * Get on-chain data for a specific coin
   */
  async getCoinMetrics(coin) {
    const chain = coin.chain;
    
    if (!chain) {
      return null; // No on-chain data for coins like BTC
    }

    if (chain === 'solana') {
      return await this.getSolanaMetrics();
    } else {
      return await this.getEVMMetrics(chain);
    }
  }

  /**
   * Batch fetch for all Alchemy-tracked coins with rate limiting
   * FREE tier: 300 CU/s, 5M CU/month
   * Each coin uses ~45 CU (getBlockNumber + getBlockByNumber)
   * Using 2-second delays to stay well within limits
   */
  async getAllCoinsMetrics(coins) {
    const results = [];
    const DELAY_MS = 2000; // 2 seconds between requests
    
    for (const coin of coins) {
      try {
        const data = await this.getCoinMetrics(coin);
        if (data) {
          results.push({
            coin_id: coin.id,
            ...data
          });
        }
        
        // Rate limit: wait 2 seconds between requests
        if (coins.indexOf(coin) < coins.length - 1) {
          await this.sleep(DELAY_MS);
        }
      } catch (error) {
        console.error(`Error fetching Alchemy data for ${coin.symbol}:`, error.message);
        // Continue with next coin even if one fails
      }
    }

    return results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
