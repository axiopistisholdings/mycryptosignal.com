# X/Twitter API Setup Instructions

The system is ready to publish signals to X/Twitter, but requires your API credentials.

## 1. Create X Developer Account

1. Go to https://developer.x.com/
2. Sign in with your X/Twitter account (the account that will post signals)
3. Apply for Developer Access (typically approved within minutes for Free tier)

## 2. Create an App

1. Go to Developer Portal: https://developer.x.com/en/portal/dashboard
2. Click "Create Project" or "Create App"
3. Fill in app details:
   - **App Name:** MyCryptoSignal Bot
   - **Description:** Automated crypto trading signals for educational purposes
   - **Website:** https://mycryptosignal.com
   - **Callback URL:** Not needed (we're not using OAuth user flow)

## 3. Generate API Keys

You need **4 credentials**:

### App-Level Keys (Step 1)
1. In your app dashboard, go to "Keys and tokens"
2. Generate **API Key and Secret**:
   - `API Key` (also called Consumer Key)
   - `API Secret` (also called Consumer Secret)

### User-Level Keys (Step 2)
3. Generate **Access Token and Secret**:
   - `Access Token`
   - `Access Token Secret`

**Important:** Save these immediately - they won't be shown again!

## 4. Set Permissions

1. In app settings, set permissions to **Read and Write**
2. This allows the app to post tweets on behalf of your account

## 5. Add Keys to Cloudflare Workers

Run these commands in your terminal:

```bash
cd /workspaces/mycryptosignal

# Set API Key (Consumer Key)
echo "YOUR_API_KEY_HERE" | npx wrangler secret put X_API_KEY

# Set API Secret (Consumer Secret)  
echo "YOUR_API_SECRET_HERE" | npx wrangler secret put X_API_SECRET

# Set Access Token
echo "YOUR_ACCESS_TOKEN_HERE" | npx wrangler secret put X_ACCESS_TOKEN

# Set Access Token Secret
echo "YOUR_ACCESS_TOKEN_SECRET_HERE" | npx wrangler secret put X_ACCESS_SECRET
```

## 6. Verify Setup

After setting secrets, test the integration:

```bash
# Trigger a manual test post (requires signals in database)
curl -X POST "https://mycryptosignal.axiopistis-systems.workers.dev/admin/test-twitter" \
  -H "Authorization: Bearer admin-token-change-me-later"
```

## 7. Automated Publishing Schedule

Once credentials are set, the system will automatically:
- Generate signals daily at **08:00 UTC**
- Publish top signals to X/Twitter
- Mark signals as published in database

No further action needed - fully automated!

## Free Tier Limits

X API Free tier allows:
- **1,500 tweets per month**
- **50 tweets per day**

Our system posts once daily (30-31 times per month) - well within limits.

## Example Tweet Format

The system will post signals like this:

```
🚀 Daily Crypto Signals - Jan 19, 2026

Bitcoin (BTC): HOLD
Confidence: 48%
Outlook: Slightly bearish short-term due to -2.99% 24h change

Ethereum (ETH): RISK  
Confidence: 50%
Outlook: Moderate risk from -4.70% decline despite 7d gains

#CryptoSignals #Bitcoin #Ethereum
```

## Troubleshooting

If tweets don't post:
1. Check Cloudflare Worker logs: `npx wrangler tail`
2. Verify all 4 secrets are set: `npx wrangler secret list`
3. Check X API status: https://api.twitterstat.us/
4. Verify app permissions are "Read and Write"

## Security Notes

- Never commit API keys to git
- Keys are stored securely in Cloudflare Secrets
- Access tokens are encrypted at rest
- Only the Worker runtime can access secrets
