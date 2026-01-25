// Test CoinGecko API connectivity
const testCoinGecko = async () => {
  console.log('🧪 Testing CoinGecko API...\n');

  try {
    // Test with free API endpoint
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&order=market_cap_desc&per_page=3&page=1&sparkline=false'
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ CoinGecko API Connection Successful!\n');
    console.log('Sample Data:');
    data.forEach(coin => {
      console.log(`\n${coin.name} (${coin.symbol.toUpperCase()})`);
      console.log(`  Price: $${coin.current_price.toLocaleString()}`);
      console.log(`  Market Cap: $${(coin.market_cap / 1e9).toFixed(2)}B`);
      console.log(`  24h Change: ${coin.price_change_percentage_24h?.toFixed(2)}%`);
    });

    console.log('\n✅ Test Complete - API is working correctly');
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
};

testCoinGecko();
