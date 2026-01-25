-- Migration 003: Complete API Key System
-- Adds missing columns to api_keys table and creates api_usage_logs table

-- Add missing columns to api_keys table
ALTER TABLE api_keys ADD COLUMN tier TEXT DEFAULT 'beta' CHECK(tier IN ('beta', 'startup', 'growth', 'enterprise'));
ALTER TABLE api_keys ADD COLUMN company TEXT;
ALTER TABLE api_keys ADD COLUMN rpm_limit INTEGER DEFAULT 60;
ALTER TABLE api_keys ADD COLUMN rpd_limit INTEGER DEFAULT 10000;
ALTER TABLE api_keys ADD COLUMN monthly_quota INTEGER DEFAULT 300000;
ALTER TABLE api_keys ADD COLUMN current_month_usage INTEGER DEFAULT 0;
ALTER TABLE api_keys ADD COLUMN quota_reset_at INTEGER DEFAULT (strftime('%s', 'now'));

-- Create api_usage_logs table for detailed request tracking
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

-- Update existing api_keys to have proper tier limits
UPDATE api_keys 
SET 
  tier = 'beta',
  rpm_limit = 60,
  rpd_limit = 10000,
  monthly_quota = 300000,
  quota_reset_at = strftime('%s', datetime('now', 'start of month', '+1 month'))
WHERE tier IS NULL OR tier = 'beta';
