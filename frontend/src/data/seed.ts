// Build-time fallbacks.
//
// These are used ONLY when the live API returns nothing at build time (e.g. no
// PUBLIC_API_KEY, or an empty database). They guarantee that the dynamic detail
// routes exist and can be verified, and give visitors a clear "sample" state.
// Live API data always takes precedence when present.

import type { Article, Coin } from '../lib/api';

/** Tracked coins from the seed migration — guarantees /signals/[symbol] pages. */
export const SEED_COINS: Coin[] = [
  { coin_id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', category: 'major', rank: 1 },
  { coin_id: 'ethereum', symbol: 'ETH', name: 'Ethereum', category: 'major', rank: 2 },
  { coin_id: 'solana', symbol: 'SOL', name: 'Solana', category: 'major', rank: 5 },
  { coin_id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', category: 'meme', rank: 8 },
];

export const IS_SAMPLE = true;

/**
 * Synthetic, clearly-labelled sample articles used for build-time detail pages
 * when the API has no published news yet. They are neutral, attributed, and
 * contain no financial advice — but they are NOT real reporting.
 */
export const SAMPLE_ARTICLES: Article[] = [
  {
    slug: 'sample-market-overview',
    headline: 'Sample: How MyCryptoSignal Reads the Market',
    excerpt:
      'A sample article demonstrating the neutral rewrite format, mandatory attribution, and not-financial-advice disclosure.',
    category: 'latest',
    source_name: 'MyCryptoSignal',
    source_url: 'https://mycryptosignal.com/news',
    published_at: 1760000000,
    word_count: 150,
    body:
      'This is a sample article shown because the live news feed returned no published items at build time. ' +
      'MyCryptoSignal ingests crypto headlines from configured sources, rewrites them in a neutral voice, and ' +
      'publishes them with mandatory source attribution.\n\n' +
      'Every article displays its source, a published timestamp, and a not-financial-advice disclaimer. ' +
      'Once the pipeline publishes real articles, they replace this sample automatically.\n\n' +
      'Source: MyCryptoSignal (https://mycryptosignal.com/news).',
  },
  {
    slug: 'sample-signals-explained',
    headline: 'Sample: What BUY, HOLD, and RISK Mean',
    excerpt:
      'A sample explainer for the three deterministic signal actions and how confidence is scored.',
    category: 'market-movers',
    source_name: 'MyCryptoSignal',
    source_url: 'https://mycryptosignal.com/signals',
    published_at: 1759900000,
    word_count: 140,
    body:
      'This is a sample article shown because the live news feed returned no published items at build time. ' +
      'MyCryptoSignal produces exactly one signal per tracked coin per day using momentum, volatility, trend, ' +
      'and on-chain inputs, then maps them to BUY, HOLD, or RISK with a confidence from 0 to 100.\n\n' +
      'These labels are informational only and are not financial advice. Confidence is a relative score, not a ' +
      'probability of profit.\n\n' +
      'Source: MyCryptoSignal (https://mycryptosignal.com/signals).',
  },
  {
    slug: 'sample-data-api',
    headline: 'Sample: Building With the Data API',
    excerpt:
      'A sample article on pulling signals, prices, and news with one API key.',
    category: 'project-announcements',
    source_name: 'MyCryptoSignal',
    source_url: 'https://mycryptosignal.com/api',
    published_at: 1759800000,
    word_count: 130,
    body:
      'This is a sample article shown because the live news feed returned no published items at build time. ' +
      'One X-API-Key unlocks signals, market, on-chain, prices, and news over a stable REST surface with ' +
      'documented rate limits and quotas.\n\n' +
      'Request a free key from the Get Access page. Keys are issued as mcs_ tokens and stored only as hashes.\n\n' +
      'Source: MyCryptoSignal (https://mycryptosignal.com/api).',
  },
];
