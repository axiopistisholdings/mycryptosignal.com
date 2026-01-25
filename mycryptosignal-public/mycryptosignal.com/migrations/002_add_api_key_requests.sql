-- Add API key requests table for website form submissions

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
