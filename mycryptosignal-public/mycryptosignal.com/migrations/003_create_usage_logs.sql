-- Migration 003: Create api_usage_logs table only
-- (api_keys columns already exist in production)

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
