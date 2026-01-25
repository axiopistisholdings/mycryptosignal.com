#!/bin/bash
# Script to set X/Twitter API credentials as Cloudflare secrets
# Run this script to configure your X publishing credentials

cd /workspaces/mycryptosignal

echo "Setting X/Twitter API credentials as Cloudflare secrets..."
echo ""

# Set API Key (Consumer Key)
echo "P7n1Nfdk23iF2GncNEgBGpofH" | CLOUDFLARE_API_TOKEN=cypVCEtGcP07mPyjtHx7bOWn9LmlB-hoT2kq-xmN npx wrangler secret put X_API_KEY
echo "✅ X_API_KEY set"
echo ""

# Set API Secret (Consumer Secret)
echo "TgdOjBeSikxVc0sesi8L81CbL1fU2Lff8yZ4kdLYwIBb6BJrvZ" | CLOUDFLARE_API_TOKEN=cypVCEtGcP07mPyjtHx7bOWn9LmlB-hoT2kq-xmN npx wrangler secret put X_API_SECRET
echo "✅ X_API_SECRET set"
echo ""

# Set Access Token
echo "1952533919699804160-53VWvQGn1NWRowvUk6bjHprLWlMkuo" | CLOUDFLARE_API_TOKEN=cypVCEtGcP07mPyjtHx7bOWn9LmlB-hoT2kq-xmN npx wrangler secret put X_ACCESS_TOKEN
echo "✅ X_ACCESS_TOKEN set"
echo ""

# Set Access Token Secret
echo "6vNm3UJqTlFOoAxOBr0S7PMvZFW8vhTmIAcSn8zI5YSDX" | CLOUDFLARE_API_TOKEN=cypVCEtGcP07mPyjtHx7bOWn9LmlB-hoT2kq-xmN npx wrangler secret put X_ACCESS_SECRET
echo "✅ X_ACCESS_SECRET set"
echo ""

echo "✅ All X/Twitter credentials configured!"
echo ""
echo "Your system will now automatically post to X/Twitter:"
echo "  • 08:30 UTC - Morning highlights"
echo "  • 14:00 UTC - Mid-day spotlight"
echo "  • 21:00 UTC - Evening update"
echo ""
echo "Next posts scheduled for tomorrow morning at 08:30 UTC"
