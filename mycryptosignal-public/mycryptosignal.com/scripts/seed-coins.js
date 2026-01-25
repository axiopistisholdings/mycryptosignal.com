// Seed coins table with the 60 tracked cryptocurrencies
import { TRACKED_COINS } from '../src/data/coins.js';

async function seedCoins() {
  console.log('🌱 Seeding coins data...');
  
  // This script should be run with wrangler d1 execute
  // Generate SQL INSERT statements
  const insertStatements = TRACKED_COINS.map(coin => {
    return `INSERT INTO coins (id, symbol, name, chain, provider) VALUES ('${coin.id}', '${coin.symbol}', '${coin.name}', ${coin.chain ? `'${coin.chain}'` : 'NULL'}, ${coin.provider ? `'${coin.provider}'` : 'NULL'});`;
  }).join('\n');

  console.log(insertStatements);
  console.log(`\n✅ Generated ${TRACKED_COINS.length} INSERT statements`);
  console.log('\nRun this with: wrangler d1 execute mycryptosignal-db --command="<paste SQL above>"\n');
}

seedCoins();
