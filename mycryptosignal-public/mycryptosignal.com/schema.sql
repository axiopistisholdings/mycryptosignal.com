-- Database schema for MyCryptoSignal backend

-- Coins table (60 tracked cryptocurrencies)
CREATE TABLE IF NOT EXISTS coins (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  chain TEXT,
  provider TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Market snapshots (from CoinGecko - every 30 minutes)
CREATE TABLE IF NOT EXISTS market_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coin_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  price REAL NOT NULL,
  market_cap REAL,
  volume_24h REAL,
  price_change_24h REAL,
  price_change_7d REAL,
  price_change_30d REAL,
  FOREIGN KEY (coin_id) REFERENCES coins(id)
);

CREATE INDEX IF NOT EXISTS idx_market_snapshots_coin_timestamp 
ON market_snapshots(coin_id, timestamp DESC);

-- On-chain snapshots (from Alchemy/Infura - every 30 minutes)
CREATE TABLE IF NOT EXISTS onchain_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coin_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  transaction_count INTEGER,
  active_addresses INTEGER,
  gas_used REAL,
  block_height INTEGER,
  network_utilization REAL,
  FOREIGN KEY (coin_id) REFERENCES coins(id)
);

CREATE INDEX IF NOT EXISTS idx_onchain_snapshots_coin_timestamp 
ON onchain_snapshots(coin_id, timestamp DESC);

-- Generated signals (once per day)
CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coin_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  signal_date TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('BUY', 'HOLD', 'RISK')),
  confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 100),
  explanation TEXT,
  layer_a_data TEXT, -- JSON of deterministic metrics
  layer_b_adjustment TEXT, -- AI explanation
  published INTEGER DEFAULT 0,
  published_at INTEGER,
  FOREIGN KEY (coin_id) REFERENCES coins(id)
);

CREATE INDEX IF NOT EXISTS idx_signals_coin_date 
ON signals(coin_id, signal_date DESC);

CREATE INDEX IF NOT EXISTS idx_signals_timestamp 
ON signals(timestamp DESC);

-- API keys for B2B access
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_hash TEXT NOT NULL UNIQUE,
  organization_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  tier TEXT DEFAULT 'beta' CHECK(tier IN ('beta', 'startup', 'growth', 'enterprise')),
  company TEXT,
  is_active INTEGER DEFAULT 1,
  rpm_limit INTEGER DEFAULT 60,
  rpd_limit INTEGER DEFAULT 10000,
  monthly_quota INTEGER DEFAULT 300000,
  current_month_usage INTEGER DEFAULT 0,
  quota_reset_at INTEGER DEFAULT (strftime('%s', 'now')),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_used_at INTEGER,
  request_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash 
ON api_keys(key_hash);

-- API key requests from website form
CREATE TABLE IF NOT EXISTS api_key_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  project_name TEXT NOT NULL,
  use_case TEXT NOT NULL,
  website TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  processed_at INTEGER,
  processed_by TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_key_requests_status 
ON api_key_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_key_requests_email 
ON api_key_requests(email);

-- System logs for monitoring
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER DEFAULT (strftime('%s', 'now')),
  log_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp 
ON system_logs(timestamp DESC);

-- API usage logs for detailed request tracking
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key_id INTEGER NOT NULL,
  timestamp INTEGER DEFAULT (strftime('%s', 'now')),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  user_agent TEXT,
  ip_address TEXT,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key_timestamp 
ON api_usage_logs(api_key_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint 
ON api_usage_logs(endpoint, timestamp DESC);
