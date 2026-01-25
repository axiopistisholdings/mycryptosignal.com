# Scripts Directory

This directory contains management scripts for the MyCryptoSignal API key system.

## 🚀 Deployment

### deploy-api-key-system.sh
Interactive deployment script that sets up the complete API key system.

```bash
./scripts/deploy-api-key-system.sh
```

**What it does:**
1. Applies database migration (adds missing columns + api_usage_logs table)
2. Configures FROM_EMAIL secret for email delivery
3. Sets/updates ADMIN_TOKEN for admin endpoints
4. Deploys Cloudflare Worker to production
5. Provides instructions for Cloudflare Email Routing setup
6. Tests the approval script

**When to run:**
- First-time API key system deployment
- After pulling updates that include schema changes

---

## 📋 API Key Request Management

### approve-api-keys.js
Hybrid approval system with spam detection for processing API key requests.

```bash
# List pending requests with spam scores
node scripts/approve-api-keys.js --list

# Auto-approve trusted requests (spam score < 30)
node scripts/approve-api-keys.js --auto

# Manually approve specific request
node scripts/approve-api-keys.js --approve 5

# Reject request with reason
node scripts/approve-api-keys.js --reject 6 "Spam detected"

# Show help
node scripts/approve-api-keys.js --help
```

**Spam Detection Features:**
- Trusted domains (Gmail, Outlook, .edu, corporate)
- Keyword filtering (scam phrases)
- Pattern matching (suspicious usernames, generic use cases)
- Score calculation (0-100, higher = more suspicious)

**Auto-Approval Criteria:**
- Spam score < 30
- Use case > 20 characters
- No spam keywords
- Trusted email domain

**When to run:**
- Daily (via cron or daily-api-operations.js)
- After users submit requests via get-access.html

---

## 📊 Daily Operations

### daily-api-operations.js
Automated daily operations and reporting for API key management.

```bash
node scripts/daily-api-operations.js
```

**What it does:**
1. ✅ Checks pending API key requests
2. ✅ Auto-approves trusted requests
3. 📊 Generates system statistics (keys, usage, requests)
4. ⚠️ Alerts on quota warnings (>80% used)
5. 🔍 Detects suspicious activity (high error rates)
6. 🏆 Shows top 5 API users today
7. 📋 Lists requests needing manual review

**Cron Example (run at 9 AM daily):**
```bash
0 9 * * * cd /path/to/mycryptosignal && node scripts/daily-api-operations.js >> /var/log/api-operations.log 2>&1
```

**When to run:**
- Once per day (automated via cron recommended)
- After deployment to check system health
- When investigating issues

---

## 🔑 API Key Generation

### create-api-key.js
Manually generate API keys (useful for VIP users or testing).

```bash
# Create beta tier key (60 RPM, 10k RPD, 300k/month)
node scripts/create-api-key.js \
  --org "Test Company" \
  --email "test@example.com" \
  --tier beta

# Create startup tier key (100 RPM, 50k RPD, 1M/month)
node scripts/create-api-key.js \
  --org "Startup Inc" \
  --email "dev@startup.com" \
  --tier startup \
  --company "Startup Website"

# Create enterprise key (2000 RPM, 1M RPD, unlimited)
node scripts/create-api-key.js \
  --org "Enterprise Corp" \
  --email "api@enterprise.com" \
  --tier enterprise
```

**Available Tiers:**
| Tier       | RPM   | RPD        | Monthly    |
|------------|-------|------------|------------|
| beta       | 60    | 10,000     | 300,000    |
| startup    | 100   | 50,000     | 1,000,000  |
| growth     | 500   | 200,000    | 5,000,000  |
| enterprise | 2,000 | 1,000,000  | Unlimited  |

**When to run:**
- Manually creating keys for partners
- Testing API key system
- VIP/paid users who need higher tiers

---

## 🧪 Testing & Health Checks

### test-coingecko.js
Test CoinGecko API connection and data fetching.

```bash
node scripts/test-coingecko.js
```

**What it tests:**
- CoinGecko API key validity
- Fetch market data for tracked coins
- Response format and data quality

---

### health-check.js
Comprehensive system health check.

```bash
node scripts/health-check.js
```

**What it checks:**
- API endpoints responding
- Database connectivity
- Recent data collection
- Signal generation status
- X/Twitter posting status

---

## 📊 Database Operations

### seed-coins.js
Populate coins table with 60 tracked cryptocurrencies.

```bash
node scripts/seed-coins.js
```

**When to run:**
- Initial setup
- After database reset
- When adding new coins to track

---

### seed-coins.sql
SQL version of coin seeding (for direct D1 execution).

```bash
npx wrangler d1 execute mycryptosignal-db --file=./scripts/seed-coins.sql --local
npx wrangler d1 execute mycryptosignal-db --file=./scripts/seed-coins.sql --remote
```

---

## 🐦 X/Twitter Setup

### setup-x-credentials.sh
Interactive script to configure X/Twitter API credentials.

```bash
./scripts/setup-x-credentials.sh
```

**What it does:**
1. Prompts for X API keys (API Key, API Secret, Access Token, Access Secret)
2. Stores them as Wrangler secrets
3. Tests X API connection

**Required credentials:**
- X_API_KEY
- X_API_SECRET
- X_ACCESS_TOKEN
- X_ACCESS_SECRET

Get these from: https://developer.twitter.com/en/portal/dashboard

---

### test-post.sh
Test X/Twitter posting without actually posting.

```bash
./scripts/test-post.sh
```

**What it does:**
- Checks X API credentials
- Validates post formatting
- Tests admin endpoints

---

### setup-twitter.md
Detailed guide for setting up X/Twitter API access.

**Topics covered:**
- Creating a Twitter Developer account
- Generating API keys
- Setting elevated access
- Configuring OAuth 1.0a

---

## 🔧 Setup Script

### setup.sh
Initial project setup script (legacy, mostly replaced by deploy-api-key-system.sh).

```bash
./scripts/setup.sh
```

**What it does:**
- Installs dependencies
- Creates D1 database
- Runs migrations
- Seeds coins

---

## 📝 Quick Reference

### Daily Workflow
```bash
# 1. Check pending requests
node scripts/daily-api-operations.js

# 2. Manually review suspicious requests (if any)
node scripts/approve-api-keys.js --list
node scripts/approve-api-keys.js --approve 5  # or reject

# 3. Check system health (optional)
node scripts/health-check.js
```

### Emergency Operations
```bash
# Revoke abusive API key
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://mycryptosignal.com/admin/api-keys/5/revoke

# View usage logs for investigation
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://mycryptosignal.com/admin/api-keys/5/usage?limit=100"

# Reactivate key after issue resolved
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://mycryptosignal.com/admin/api-keys/5/activate
```

### Database Queries
```bash
# Total API requests today
echo "SELECT COUNT(*) FROM api_usage_logs WHERE date(timestamp, 'unixepoch') = date('now')" | \
  npx wrangler d1 execute mycryptosignal-db --local

# Active API keys count
echo "SELECT COUNT(*) FROM api_keys WHERE is_active = 1" | \
  npx wrangler d1 execute mycryptosignal-db --local

# Monthly usage by tier
echo "SELECT tier, SUM(current_month_usage) as total FROM api_keys GROUP BY tier" | \
  npx wrangler d1 execute mycryptosignal-db --local
```

---

## 🆘 Troubleshooting

### "API key not found" when testing
- Check key was inserted correctly: `echo "SELECT * FROM api_keys" | npx wrangler d1 execute mycryptosignal-db --local`
- Verify key hash is correct (SHA-256 of the raw key)

### Email not sending
- Verify FROM_EMAIL secret is set: `npx wrangler secret list`
- Check Cloudflare Email Routing is configured
- Test MailChannels connectivity (automatic with Cloudflare Workers)

### Auto-approval not working
- Check spam score: `node scripts/approve-api-keys.js --list`
- Verify trusted domains in approve-api-keys.js
- Manually approve: `node scripts/approve-api-keys.js --approve <id>`

### High error rates detected
- View logs: `curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://mycryptosignal.com/admin/api-keys/<id>/usage?limit=100"`
- Check for:
  - Invalid API key usage (401)
  - Rate limit exceeded (429)
  - Server errors (500)

---

## 📚 Additional Resources

- **API Documentation:** `/docs/API_DOCUMENTATION.md`
- **Implementation Guide:** `/API_KEY_IMPLEMENTATION.md`
- **Frontend Integration:** `/docs/FRONTEND_INTEGRATION.md`
- **Rate Limits:** `/RATE_LIMITS_SUMMARY.md`

---

## 🔐 Security Best Practices

1. **Never commit secrets:**
   - API keys go in Wrangler secrets
   - Use `.env.local` for local testing (gitignored)

2. **Rotate admin token regularly:**
   ```bash
   npx wrangler secret put ADMIN_TOKEN
   ```

3. **Monitor usage logs:**
   - Run daily-api-operations.js daily
   - Set up alerts for high error rates

4. **Revoke compromised keys immediately:**
   ```bash
   curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://mycryptosignal.com/admin/api-keys/<id>/revoke
   ```

---

## 📞 Support

For questions or issues:
- Check `API_KEY_IMPLEMENTATION.md` for detailed docs
- Review system logs: `echo "SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 50" | npx wrangler d1 execute mycryptosignal-db --local`
- Open an issue on GitHub

---

**Last Updated:** January 24, 2026
**Version:** 1.0.0
