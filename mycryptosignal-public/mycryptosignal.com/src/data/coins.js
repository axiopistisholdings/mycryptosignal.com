// Complete list of 60 tracked cryptocurrencies with CoinGecko IDs and chain info
export const TRACKED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', chain: null, provider: null },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', chain: 'ethereum', provider: 'alchemy' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', chain: 'ethereum', provider: 'alchemy' },
  { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', chain: 'bsc', provider: 'infura' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', chain: null, provider: null },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', chain: 'ethereum', provider: 'alchemy' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', chain: 'cardano', provider: 'infura' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', chain: null, provider: null },
  { id: 'tron', symbol: 'TRX', name: 'TRON', chain: 'tron', provider: 'infura' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', chain: 'ethereum', provider: 'alchemy' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', chain: 'polkadot', provider: 'infura' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', chain: null, provider: null },
  { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash', chain: null, provider: null },
  { id: 'wrapped-bitcoin', symbol: 'WBTC', name: 'Wrapped Bitcoin', chain: 'ethereum', provider: 'alchemy' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', chain: 'ethereum', provider: 'alchemy' },
  { id: 'dai', symbol: 'DAI', name: 'Dai', chain: 'ethereum', provider: 'alchemy' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', chain: null, provider: null },
  { id: 'monero', symbol: 'XMR', name: 'Monero', chain: null, provider: null },
  { id: 'ethereum-classic', symbol: 'ETC', name: 'Ethereum Classic', chain: 'ethereum-classic', provider: 'infura' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos', chain: 'cosmos', provider: 'infura' },
  { id: 'vechain', symbol: 'VET', name: 'VeChain', chain: 'vechain', provider: 'infura' },
  { id: 'aave', symbol: 'AAVE', name: 'Aave', chain: 'ethereum', provider: 'alchemy' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', chain: 'solana', provider: 'alchemy' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', chain: 'avalanche', provider: 'alchemy' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', chain: 'ethereum', provider: 'alchemy' },
  { id: 'matic-network', symbol: 'POL', name: 'Polygon', chain: 'polygon', provider: 'alchemy' },
  { id: 'near', symbol: 'NEAR', name: 'Near Protocol', chain: 'near', provider: 'infura' },
  { id: 'the-open-network', symbol: 'TON', name: 'Toncoin', chain: 'ton', provider: 'infura' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', chain: 'ethereum', provider: 'alchemy' },
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', chain: 'arbitrum', provider: 'alchemy' },
  { id: 'optimism', symbol: 'OP', name: 'Optimism', chain: 'optimism', provider: 'alchemy' },
  { id: 'kaspa', symbol: 'KAS', name: 'Kaspa', chain: null, provider: null },
  { id: 'sui', symbol: 'SUI', name: 'Sui', chain: 'sui', provider: 'infura' },
  { id: 'aptos', symbol: 'APT', name: 'Aptos', chain: 'aptos', provider: 'infura' },
  { id: 'render-token', symbol: 'RNDR', name: 'Render', chain: 'ethereum', provider: 'alchemy' },
  { id: 'stacks', symbol: 'STX', name: 'Stacks', chain: 'stacks', provider: 'infura' },
  { id: 'immutable-x', symbol: 'IMX', name: 'Immutable', chain: 'ethereum', provider: 'alchemy' },
  { id: 'lido-dao', symbol: 'LDO', name: 'Lido DAO', chain: 'ethereum', provider: 'alchemy' },
  { id: 'injective-protocol', symbol: 'INJ', name: 'Injective', chain: 'injective', provider: 'infura' },
  { id: 'bittensor', symbol: 'TAO', name: 'Bittensor', chain: null, provider: null },
  { id: 'fetch-ai', symbol: 'FET', name: 'Fetch.ai', chain: 'ethereum', provider: 'alchemy' },
  { id: 'celestia', symbol: 'TIA', name: 'Celestia', chain: 'celestia', provider: 'infura' },
  { id: 'sei-network', symbol: 'SEI', name: 'Sei', chain: 'sei', provider: 'infura' },
  { id: 'mantle', symbol: 'MNT', name: 'Mantle', chain: 'mantle', provider: 'infura' },
  { id: 'arweave', symbol: 'AR', name: 'Arweave', chain: 'arweave', provider: 'infura' },
  { id: 'quant-network', symbol: 'QNT', name: 'Quant', chain: 'ethereum', provider: 'alchemy' },
  { id: 'thorchain', symbol: 'RUNE', name: 'ThorChain', chain: 'thorchain', provider: 'infura' },
  { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter', chain: 'solana', provider: 'alchemy' },
  { id: 'ethena', symbol: 'ENA', name: 'Ethena', chain: 'ethereum', provider: 'alchemy' },
  { id: 'pyth-network', symbol: 'PYTH', name: 'Pyth Network', chain: 'solana', provider: 'alchemy' },
  { id: 'maker', symbol: 'MKR', name: 'Maker', chain: 'ethereum', provider: 'alchemy' },
  { id: 'the-graph', symbol: 'GRT', name: 'The Graph', chain: 'ethereum', provider: 'alchemy' },
  { id: 'algorand', symbol: 'ALGO', name: 'Algorand', chain: 'algorand', provider: 'infura' },
  { id: 'worldcoin-wld', symbol: 'WLD', name: 'Worldcoin', chain: 'ethereum', provider: 'alchemy' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', chain: 'solana', provider: 'alchemy' },
  { id: 'dogwifcoin', symbol: 'WIF', name: 'dogwifhat', chain: 'solana', provider: 'alchemy' },
  { id: 'jasmycoin', symbol: 'JASMY', name: 'JasmyCoin', chain: 'ethereum', provider: 'alchemy' },
  { id: 'bitget-token', symbol: 'BGB', name: 'Bitget Token', chain: 'ethereum', provider: 'alchemy' },
  { id: 'beam-2', symbol: 'BEAM', name: 'Beam', chain: 'beam', provider: 'infura' },
  { id: 'fantom', symbol: 'FTM', name: 'Fantom', chain: 'fantom', provider: 'infura' }
];

// Helper functions
export function getAlchemyCoins() {
  return TRACKED_COINS.filter(coin => coin.provider === 'alchemy');
}

export function getInfuraCoins() {
  return TRACKED_COINS.filter(coin => coin.provider === 'infura');
}

export function getCoinById(id) {
  return TRACKED_COINS.find(coin => coin.id === id);
}

export function getCoinBySymbol(symbol) {
  return TRACKED_COINS.find(coin => coin.symbol === symbol.toUpperCase());
}
