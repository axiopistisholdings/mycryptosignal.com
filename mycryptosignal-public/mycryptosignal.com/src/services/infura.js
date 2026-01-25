// Infura API service for on-chain data (remaining subset of 30 coins)
export class InfuraService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.networks = {
      ethereum: `https://mainnet.infura.io/v3/${apiKey}`,
      polygon: `https://polygon-mainnet.infura.io/v3/${apiKey}`,
      arbitrum: `https://arbitrum-mainnet.infura.io/v3/${apiKey}`,
      optimism: `https://optimism-mainnet.infura.io/v3/${apiKey}`,
      avalanche: `https://avalanche-mainnet.infura.io/v3/${apiKey}`
    };
  }

  /**
   * Get network endpoint for a specific chain
   */
  getNetworkUrl(chain) {
    return this.networks[chain] || this.networks.ethereum;
  }

  /**
   * Fetch on-chain metrics for supported chains
   */
  async getChainMetrics(chain) {
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

      // Get block details
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
      console.error(`Infura ${chain} metrics error:`, error);
      return null;
    }
  }

  /**
   * Get on-chain data for a specific coin
   * For chains not directly supported by Infura, return null
   */
  async getCoinMetrics(coin) {
    const chain = coin.chain;
    
    if (!chain || !this.networks[chain]) {
      // For non-EVM chains or unsupported chains, return placeholder
      return {
        timestamp: Math.floor(Date.now() / 1000),
        transaction_count: 0,
        gas_used: 0,
        block_height: 0,
        network_utilization: 0
      };
    }

    return await this.getChainMetrics(chain);
  }

  /**
   * Batch fetch for all Infura-tracked coins with rate limiting
   * FREE tier: 100K requests/day, 10 req/s burst, ~3 req/s sustained
   * Using 500ms delays for safety
   */
  async getAllCoinsMetrics(coins) {
    const results = [];
    const DELAY_MS = 500; // 500ms between requests (2 req/s)
    
    for (const coin of coins) {
      try {
        const data = await this.getCoinMetrics(coin);
        if (data) {
          results.push({
            coin_id: coin.id,
            ...data
          });
        }
        
        // Rate limit: wait 500ms between requests
        if (coins.indexOf(coin) < coins.length - 1) {
          await this.sleep(DELAY_MS);
        }
      } catch (error) {
        console.error(`Error fetching Infura data for ${coin.symbol}:`, error.message);
        // Continue with next coin even if one fails
      }
    }

    return results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
