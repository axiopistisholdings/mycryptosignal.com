# Frontend Integration Guide

## Overview

Your static HTML frontend at `https://mycryptosignal.com` can call the backend API at `https://mycryptosignal.axiopistis-systems.workers.dev`.

**CORS is configured** to allow requests from `mycryptosignal.com` only.

---

## Available Endpoints for Frontend

### 1. Health Check (No Auth)

```javascript
fetch('https://mycryptosignal.axiopistis-systems.workers.dev/api/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1642684800000
}
```

---

### 2. Get All Coins

```javascript
fetch('https://mycryptosignal.axiopistis-systems.workers.dev/api/coins', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY_HERE'
  }
})
.then(res => res.json())
.then(data => {
  console.log(data.coins); // Array of 60 coins
});
```

**Response:**
```json
{
  "coins": [
    {
      "id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin",
      "chain": null,
      "provider": null
    }
  ]
}
```

---

### 3. Get Latest Market Data

```javascript
fetch('https://mycryptosignal.axiopistis-systems.workers.dev/api/market', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY_HERE'
  }
})
.then(res => res.json())
.then(data => {
  console.log(data.data); // Market snapshots for all coins
});
```

**Response:**
```json
{
  "data": [
    {
      "id": 123,
      "coin_id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin",
      "timestamp": 1642684800,
      "price": 42500.50,
      "market_cap": 805000000000,
      "volume_24h": 32500000000,
      "price_change_24h": 2.5,
      "price_change_7d": -1.2,
      "price_change_30d": 8.7
    }
  ],
  "count": 60
}
```

---

### 4. Get Latest Signals

```javascript
fetch('https://mycryptosignal.axiopistis-systems.workers.dev/api/signals', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY_HERE'
  }
})
.then(res => res.json())
.then(data => {
  console.log(data.signals); // Array of signals
});
```

**Response:**
```json
{
  "signals": [
    {
      "coin_id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin",
      "action": "HOLD",
      "confidence": 55,
      "explanation": "Neutral market conditions. Wait for clearer trend...",
      "signal_date": "2026-01-20",
      "timestamp": 1642665600
    }
  ],
  "count": 60
}
```

**Signal Actions:**
- `BUY` - Bullish signal
- `HOLD` - Neutral signal
- `RISK` - Bearish signal

---

### 5. Get On-Chain Data

```javascript
fetch('https://mycryptosignal.axiopistis-systems.workers.dev/api/onchain', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY_HERE'
  }
})
.then(res => res.json())
.then(data => {
  console.log(data.data); // On-chain metrics for all coins
});
```

**Response:**
```json
{
  "data": [
    {
      "id": 456,
      "coin_id": "ethereum",
      "symbol": "ETH",
      "name": "Ethereum",
      "timestamp": 1642684800,
      "transaction_count": 1250000,
      "active_addresses": 450000,
      "gas_used": 12500000000000,
      "block_height": 14000000,
      "network_utilization": 0.75
    }
  ],
  "count": 60
}
```

---

### 6. Get Signal History

```javascript
const coinId = 'bitcoin';
const days = 7;

fetch(`https://mycryptosignal.axiopistis-systems.workers.dev/api/signals/history?coin_id=${coinId}&days=${days}`, {
  headers: {
    'X-API-Key': 'YOUR_API_KEY_HERE'
  }
})
.then(res => res.json())
.then(data => {
  console.log(data.history); // Historical signals
});
```

**Response:**
```json
{
  "coin_id": "bitcoin",
  "history": [
    {
      "id": 789,
      "coin_id": "bitcoin",
      "timestamp": 1642665600,
      "signal_date": "2026-01-20",
      "action": "BUY",
      "confidence": 78.5,
      "explanation": "Strong bullish momentum...",
      "layer_a_data": "{...}",
      "layer_b_adjustment": "AI enhancement..."
    }
  ],
  "count": 7
}
```

---

## Complete HTML Example

Here's a full working example you can deploy to mycryptosignal.com:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MyCryptoSignal - AI Trading Signals</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      color: #fff;
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      text-align: center;
      padding: 40px 0;
      border-bottom: 2px solid #00ff88;
      margin-bottom: 40px;
    }
    
    h1 {
      font-size: 48px;
      color: #00ff88;
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 18px;
      color: #aaa;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #00ff88;
    }
    
    .stat-label {
      font-size: 14px;
      color: #aaa;
      margin-top: 5px;
    }
    
    .signals-grid {
      display: grid;
      gap: 20px;
    }
    
    .signal {
      background: #1a1f3a;
      border-radius: 12px;
      padding: 24px;
      border-left: 5px solid #666;
      transition: transform 0.2s;
    }
    
    .signal:hover {
      transform: translateX(5px);
    }
    
    .signal.BUY { border-left-color: #00ff88; }
    .signal.RISK { border-left-color: #ff4444; }
    .signal.HOLD { border-left-color: #ffaa00; }
    
    .signal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .coin-info h3 {
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    .coin-info .symbol {
      color: #aaa;
      font-size: 14px;
    }
    
    .signal-action {
      text-align: right;
    }
    
    .action-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }
    
    .action-badge.BUY {
      background: rgba(0, 255, 136, 0.2);
      color: #00ff88;
    }
    
    .action-badge.RISK {
      background: rgba(255, 68, 68, 0.2);
      color: #ff4444;
    }
    
    .action-badge.HOLD {
      background: rgba(255, 170, 0, 0.2);
      color: #ffaa00;
    }
    
    .confidence {
      font-size: 28px;
      font-weight: bold;
      margin-top: 5px;
    }
    
    .explanation {
      color: #ccc;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    
    .timestamp {
      font-size: 12px;
      color: #666;
    }
    
    .loading {
      text-align: center;
      padding: 60px;
      font-size: 18px;
      color: #aaa;
    }
    
    .error {
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      color: #ff4444;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🤖 MyCryptoSignal</h1>
      <p class="subtitle">AI-Powered Cryptocurrency Trading Signals</p>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value" id="totalSignals">0</div>
        <div class="stat-label">Total Signals</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="buySignals">0</div>
        <div class="stat-label">BUY Signals</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="holdSignals">0</div>
        <div class="stat-label">HOLD Signals</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="riskSignals">0</div>
        <div class="stat-label">RISK Signals</div>
      </div>
    </div>

    <div id="signals" class="signals-grid">
      <div class="loading">Loading signals...</div>
    </div>
  </div>

  <script>
    // ⚠️ REPLACE WITH YOUR ACTUAL API KEY
    const API_KEY = 'mcs_your_api_key_here';
    const API_BASE = 'https://mycryptosignal.axiopistis-systems.workers.dev';

    async function loadSignals() {
      try {
        const response = await fetch(`${API_BASE}/api/signals`, {
          headers: {
            'X-API-Key': API_KEY
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        displaySignals(data.signals);
        updateStats(data.signals);
      } catch (error) {
        console.error('Error loading signals:', error);
        document.getElementById('signals').innerHTML = `
          <div class="error">
            <strong>Error loading signals:</strong> ${error.message}
            <br><br>
            Please check your API key and try again.
          </div>
        `;
      }
    }

    function displaySignals(signals) {
      // Sort by confidence (highest first)
      const sorted = signals.sort((a, b) => b.confidence - a.confidence);
      
      const html = sorted.map(signal => `
        <div class="signal ${signal.action}">
          <div class="signal-header">
            <div class="coin-info">
              <h3>${signal.name}</h3>
              <div class="symbol">${signal.symbol}</div>
            </div>
            <div class="signal-action">
              <div class="action-badge ${signal.action}">${signal.action}</div>
              <div class="confidence">${Math.round(signal.confidence)}%</div>
            </div>
          </div>
          <p class="explanation">${signal.explanation}</p>
          <div class="timestamp">
            Generated: ${new Date(signal.timestamp * 1000).toLocaleString()}
          </div>
        </div>
      `).join('');
      
      document.getElementById('signals').innerHTML = html;
    }

    function updateStats(signals) {
      const buy = signals.filter(s => s.action === 'BUY').length;
      const hold = signals.filter(s => s.action === 'HOLD').length;
      const risk = signals.filter(s => s.action === 'RISK').length;
      
      document.getElementById('totalSignals').textContent = signals.length;
      document.getElementById('buySignals').textContent = buy;
      document.getElementById('holdSignals').textContent = hold;
      document.getElementById('riskSignals').textContent = risk;
    }

    // Load signals on page load
    loadSignals();
    
    // Auto-refresh every 5 minutes
    setInterval(loadSignals, 5 * 60 * 1000);
  </script>
</body>
</html>
```

---

## Rate Limits

All API endpoints have rate limits based on your tier:

**Beta Partners:**
- 60 requests per minute
- 10,000 requests per day
- 300,000 requests per month

Rate limit info is included in response headers:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1642684800
X-Quota-Limit: 300000
X-Quota-Remaining: 299999
```

---

## Authentication

All `/api/*` endpoints (except `/api/health`) require an API key in the `X-API-Key` header:

```javascript
headers: {
  'X-API-Key': 'mcs_your_api_key_here'
}
```

Contact support to get your API key.

---

## Error Handling

Always handle errors gracefully:

```javascript
fetch(url, { headers })
  .then(res => {
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    // Success - display data
  })
  .catch(error => {
    console.error('API call failed:', error);
    // Show error message to user
  });
```

**Common error codes:**
- `401` - Invalid or missing API key
- `429` - Rate limit exceeded
- `500` - Server error

---

## Best Practices

### 1. Cache API Responses

Don't fetch the same data repeatedly:

```javascript
// Cache signals for 23 hours (they update daily at 08:00 UTC)
const CACHE_KEY = 'crypto_signals';
const CACHE_DURATION = 23 * 60 * 60 * 1000; // 23 hours

async function getCachedSignals() {
  const cached = localStorage.getItem(CACHE_KEY);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  
  // Fetch fresh data
  const response = await fetch(API_BASE + '/api/signals', { headers });
  const data = await response.json();
  
  // Cache it
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  
  return data;
}
```

### 2. Monitor Rate Limits

Check headers and warn users:

```javascript
const response = await fetch(url, { headers });
const remaining = response.headers.get('X-RateLimit-Remaining');

if (remaining < 10) {
  console.warn('Rate limit almost exceeded:', remaining, 'requests remaining');
}
```

### 3. Handle Network Errors

```javascript
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

---

## Support

**Questions?** Contact support@mycryptosignal.com

**Documentation:** https://github.com/axiopistisholdings/mycryptosignal/tree/main/docs
