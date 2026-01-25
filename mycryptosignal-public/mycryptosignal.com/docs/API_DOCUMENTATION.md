# MyCryptoSignal API Documentation

**Version:** 1.0  
**Base URL:** `https://mycryptosignal.axiopistis-systems.workers.dev`  
**Authentication:** API Key (Header)

## Overview

MyCryptoSignal provides AI-powered cryptocurrency trading signals for 60 major cryptocurrencies, updated every 30 minutes. Our API delivers market data, on-chain metrics, and actionable trading signals (BUY/HOLD/RISK) with confidence scores.

**Key Features:**
- ✅ 60 cryptocurrencies tracked
- ✅ 30-minute data collection cadence
- ✅ Daily AI-enhanced trading signals
- ✅ Market data from CoinGecko
- ✅ On-chain data from Alchemy/Infura
- ✅ Read-only access (no trading execution)

---

## Authentication

All API requests (except `/api/health`) require an API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: mcs_your_api_key_here" \
  https://mycryptosignal.axiopistis-systems.workers.dev/api/signals
```

### Rate Limits

Your API key has specific rate limits based on your tier:

| Tier | Requests/Minute | Requests/Day | Monthly Quota |
|------|----------------|--------------|---------------|
| **Beta** | 60 | 10,000 | 300,000 |
| **Startup** | 100 | 50,000 | 1,000,000 |
| **Growth** | 500 | 200,000 | 5,000,000 |
| **Enterprise** | 2,000 | 1,000,000 | Unlimited |

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642684800
X-Quota-Limit: 300000
X-Quota-Remaining: 275432
X-Quota-Reset: 1643673600
```

### Error Responses

**401 Unauthorized** - Invalid or missing API key
```json
{
  "error": "Invalid or missing API key"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "error": "Rate limit exceeded: 60 requests per minute. Retry after 42s"
}
```

---

## Endpoints

### 1. Health Check

**`GET /api/health`**

Check API availability (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1642684800000
}
```

**Example:**
```bash
curl https://mycryptosignal.axiopistis-systems.workers.dev/api/health
```

---

### 2. List Tracked Coins

**`GET /api/coins`**

Get the list of 60 tracked cryptocurrencies.

**Response:**
```json
{
  "coins": [
    {
      "id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin",
      "chain": "Bitcoin",
      "provider": "coingecko"
    },
    {
      "id": "ethereum",
      "symbol": "ETH",
      "name": "Ethereum",
      "chain": "Ethereum",
      "provider": "alchemy"
    }
    // ... 58 more coins
  ]
}
```

**Example:**
```bash
curl -H "X-API-Key: mcs_your_key" \
  https://mycryptosignal.axiopistis-systems.workers.dev/api/coins
```

---

### 3. Get Market Data

**`GET /api/market`**

Get latest market snapshots (price, volume, market cap) for all tracked coins.

**Update Frequency:** Every 30 minutes

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
    // ... 59 more coins
  ],
  "count": 60
}
```

**Example:**
```bash
curl -H "X-API-Key: mcs_your_key" \
  https://mycryptosignal.axiopistis-systems.workers.dev/api/market
```

**Python Example:**
```python
import requests

headers = {"X-API-Key": "mcs_your_key"}
response = requests.get(
    "https://mycryptosignal.axiopistis-systems.workers.dev/api/market",
    headers=headers
)
data = response.json()

for coin in data['data']:
    print(f"{coin['symbol']}: ${coin['price']:.2f} ({coin['price_change_24h']:+.2f}%)")
```

---

### 4. Get On-Chain Data

**`GET /api/onchain`**

Get latest on-chain metrics (transactions, addresses, gas, network utilization).

**Update Frequency:** Every 30 minutes

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
    // ... more coins with on-chain data
  ],
  "count": 60
}
```

**Example:**
```bash
curl -H "X-API-Key: mcs_your_key" \
  https://mycryptosignal.axiopistis-systems.workers.dev/api/onchain
```

---

### 5. Get Trading Signals

**`GET /api/signals`**

Get today's AI-powered trading signals for all coins.

**Update Frequency:** Once daily at 08:00 UTC

**Response:**
```json
{
  "signals": [
    {
      "coin_id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin",
      "action": "BUY",
      "confidence": 78.5,
      "explanation": "Strong bullish momentum with increasing on-chain activity. Price broke resistance at $42K with volume confirmation.",
      "signal_date": "2026-01-20",
      "timestamp": 1642665600
    },
    {
      "coin_id": "ethereum",
      "symbol": "ETH",
      "name": "Ethereum",
      "action": "HOLD",
      "confidence": 55.0,
      "explanation": "Neutral market conditions. Wait for clearer trend before taking action.",
      "signal_date": "2026-01-20",
      "timestamp": 1642665600
    },
    {
      "coin_id": "solana",
      "symbol": "SOL",
      "name": "Solana",
      "action": "RISK",
      "confidence": 82.0,
      "explanation": "Bearish divergence detected. Network utilization declining while price remains elevated.",
      "signal_date": "2026-01-20",
      "timestamp": 1642665600
    }
    // ... 57 more signals
  ],
  "count": 60
}
```

**Signal Actions:**
- **BUY**: Bullish signal - consider buying
- **HOLD**: Neutral - maintain current position
- **RISK**: Bearish signal - consider selling or avoiding

**Confidence Score:** 0-100, higher = stronger conviction

**Example:**
```bash
curl -H "X-API-Key: mcs_your_key" \
  https://mycryptosignal.axiopistis-systems.workers.dev/api/signals
```

**JavaScript Example:**
```javascript
const response = await fetch(
  'https://mycryptosignal.axiopistis-systems.workers.dev/api/signals',
  {
    headers: { 'X-API-Key': 'mcs_your_key' }
  }
);

const { signals } = await response.json();

// Filter high-confidence BUY signals
const buySignals = signals
  .filter(s => s.action === 'BUY' && s.confidence >= 75)
  .sort((a, b) => b.confidence - a.confidence);

console.log('Top buy opportunities:', buySignals.slice(0, 5));
```

---

### 6. Get Signal History

**`GET /api/signals/history?coin_id=<id>&days=<days>`**

Get historical signals for a specific coin.

**Query Parameters:**
- `coin_id` (required): Coin identifier (e.g., "bitcoin", "ethereum")
- `days` (optional): Number of days to retrieve (default: 30, max: 365)

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
      "explanation": "Strong bullish momentum..."
    },
    {
      "id": 788,
      "coin_id": "bitcoin",
      "timestamp": 1642579200,
      "signal_date": "2026-01-19",
      "action": "HOLD",
      "confidence": 55.0,
      "explanation": "Neutral market conditions..."
    }
    // ... more historical signals
  ],
  "count": 30
}
```

**Example:**
```bash
# Get last 7 days of Bitcoin signals
curl -H "X-API-Key: mcs_your_key" \
  "https://mycryptosignal.axiopistis-systems.workers.dev/api/signals/history?coin_id=bitcoin&days=7"
```

---

## Best Practices

### 1. Caching

Cache responses appropriately based on update frequency:
- **Market/On-chain data**: Cache for 25-30 minutes (updates every 30 min)
- **Signals**: Cache for 23 hours (updates daily at 08:00 UTC)
- **Coins list**: Cache indefinitely (rarely changes)

### 2. Error Handling

Always handle rate limits gracefully:

```python
import time

def fetch_with_retry(url, headers, max_retries=3):
    for attempt in range(max_retries):
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            print(f"Rate limited. Retrying after {retry_after}s...")
            time.sleep(retry_after)
        else:
            response.raise_for_status()
    
    raise Exception("Max retries exceeded")
```

### 3. Webhooks (Coming Soon)

For real-time updates without polling, webhook support is planned for Growth and Enterprise tiers.

### 4. Batch Requests

To optimize your quota:
- Fetch `/api/signals` once daily at 08:30 UTC (after generation)
- Fetch `/api/market` and `/api/onchain` on-demand or every 30 minutes
- Use `/api/signals/history` sparingly for backfilling only

---

## Data Retention

- **Market snapshots**: 90 days
- **On-chain snapshots**: 90 days  
- **Signals**: 365 days

---

## Support

**Beta Partners:**
- Email: support@mycryptosignal.com
- Response time: 24-48 hours

**Paid Tiers:**
- Priority email support
- Dedicated Slack channel (Enterprise)

---

## Changelog

### 2026-01-20 - v1.0
- Initial API launch
- Beta program begins
- 60 cryptocurrencies tracked
- Daily signals with AI enhancement

---

## Legal Disclaimer

⚠️ **IMPORTANT**: MyCryptoSignal provides informational data only. Signals are NOT financial advice. Trading cryptocurrencies carries significant risk. Always do your own research and consult with qualified financial advisors before making investment decisions. Past performance does not guarantee future results.
