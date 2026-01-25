// CoinGecko API service for market data collection
export class CoinGeckoService {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    // FREE demo API uses the public endpoint with demo key header
    this.baseUrl = 'https://api.coingecko.com/api/v3';
  }

  /**
   * Fetch market data for multiple coins in a single request
   * FREE tier allows up to 250 coins per request, 10-15 calls/minute
   * @param {string[]} coinIds - Array of CoinGecko coin IDs
   * @returns {Promise<Array>} Market data for all coins
   */
  async getMarketData(coinIds) {
    try {
      const idsString = coinIds.join(',');
      const params = new URLSearchParams({
        ids: idsString,
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: coinIds.length,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h,7d,30d'
      });

      const headers = {};
      if (this.apiKey) {
        // Demo/Free API key header
        headers['x-cg-demo-api-key'] = this.apiKey;
      }

      const response = await fetch(
        `${this.baseUrl}/coins/markets?${params}`,
        { headers }
      );

      // Handle rate limiting - FREE tier: ~10-15 calls/minute
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        console.error(`CoinGecko rate limit hit. Retry after ${retryAfter}s`);
        throw new Error(`RATE_LIMIT:${retryAfter}`);
      }

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return data
        .filter(coin => coin.current_price != null) // Filter out coins with null prices
        .map(coin => ({
          coin_id: coin.id,
          timestamp: Math.floor(Date.now() / 1000),
          price: coin.current_price,
          market_cap: coin.market_cap || 0,
          volume_24h: coin.total_volume || 0,
          price_change_24h: coin.price_change_percentage_24h || 0,
          price_change_7d: coin.price_change_percentage_7d_in_currency || 0,
          price_change_30d: coin.price_change_percentage_30d_in_currency || 0
        }));
    } catch (error) {
      console.error('CoinGecko service error:', error);
      throw error;
    }
  }

  /**
   * Batch fetch for all 60 coins (may need to be split if rate limited)
   * @param {string[]} coinIds - Array of all coin IDs
   * @returns {Promise<Array>} Complete market data
   */
  async getAllCoinsMarketData(coinIds) {
    // CoinGecko allows up to 250 coins per request, so 60 is fine in one call
    return await this.getMarketData(coinIds);
  }
}
