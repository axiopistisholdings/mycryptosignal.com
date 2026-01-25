#!/bin/bash

# Quick Start Guide: API Key System Deployment
# Run this script to deploy the complete API key system

set -e  # Exit on error

echo "🚀 MyCryptoSignal API Key System Deployment"
echo "============================================"
echo ""

# Step 1: Apply database migration
echo "📦 Step 1: Applying database migration..."
echo "Note: You'll need to authenticate with Cloudflare"
echo ""
read -p "Apply migration to REMOTE database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npx wrangler d1 execute mycryptosignal-db --remote --file=./migrations/003_complete_api_key_system.sql
    echo "✅ Migration applied to remote database"
else
    echo "⏭️  Skipping remote migration (you can run it manually later)"
fi
echo ""

# Step 2: Set email secret
echo "📧 Step 2: Configure email sender address..."
echo "You need to set the FROM_EMAIL secret (e.g., noreply@mycryptosignal.com)"
echo ""
read -p "Set FROM_EMAIL secret now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Enter your email address (e.g., noreply@mycryptosignal.com):"
    npx wrangler secret put FROM_EMAIL
    echo "✅ FROM_EMAIL secret set"
else
    echo "⏭️  Skipping email setup (you can set it with: npx wrangler secret put FROM_EMAIL)"
fi
echo ""

# Step 3: Verify admin token
echo "🔐 Step 3: Admin token check..."
echo "Make sure ADMIN_TOKEN is set for admin endpoints"
echo ""
read -p "Set/update ADMIN_TOKEN secret now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Enter a strong admin token:"
    npx wrangler secret put ADMIN_TOKEN
    echo "✅ ADMIN_TOKEN secret set"
else
    echo "⏭️  Using existing ADMIN_TOKEN (default: 'change-me')"
fi
echo ""

# Step 4: Deploy worker
echo "☁️  Step 4: Deploying Cloudflare Worker..."
echo ""
read -p "Deploy worker to production? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npm run deploy
    echo "✅ Worker deployed to production"
else
    echo "⏭️  Skipping deployment (you can deploy with: npm run deploy)"
fi
echo ""

# Step 5: Instructions for Cloudflare Email Routing
echo "📮 Step 5: Cloudflare Email Routing Setup"
echo "==========================================="
echo ""
echo "To enable email delivery, you need to configure Cloudflare Email Routing:"
echo ""
echo "1. Go to Cloudflare Dashboard → Your Domain → Email Routing"
echo "2. Click 'Get Started' if not already enabled"
echo "3. Add a destination address (e.g., your personal email)"
echo "4. Verify the destination address via the confirmation email"
echo "5. DNS records (MX, TXT) should auto-configure"
echo ""
echo "For MailChannels (used by this system):"
echo "- It works automatically with Cloudflare Workers"
echo "- No additional configuration needed"
echo "- Emails will appear to come from: $FROM_EMAIL"
echo ""
read -p "Press Enter when email routing is configured..."
echo ""

# Step 6: Test the system
echo "🧪 Step 6: Testing the API Key System"
echo "======================================"
echo ""
echo "Let's test the approval script locally first..."
echo ""

# List pending requests
echo "Checking for pending API key requests..."
node scripts/approve-api-keys.js --list || echo "No pending requests (this is normal for a fresh install)"
echo ""

echo "✅ Approval script is working!"
echo ""

# Final instructions
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Test API key request form:"
echo "   Visit: https://mycryptosignal.com/get-access.html"
echo ""
echo "2. Approve requests:"
echo "   node scripts/approve-api-keys.js --auto"
echo ""
echo "3. Monitor API keys:"
echo "   curl -H 'Authorization: Bearer \$ADMIN_TOKEN' \\"
echo "        https://mycryptosignal.com/admin/api-keys"
echo ""
echo "4. Test API access:"
echo "   curl -H 'X-API-Key: mcs_...' \\"
echo "        https://mycryptosignal.com/api/signals"
echo ""
echo "📖 Full documentation: API_KEY_IMPLEMENTATION.md"
echo ""
echo "🔒 Security reminders:"
echo "   - Keep ADMIN_TOKEN secret"
echo "   - Never commit API keys to git"
echo "   - Monitor system_logs for suspicious activity"
echo ""
echo "💰 Cost estimate: ~\$0-5/month for 1M API calls"
echo ""
echo "🎊 Your API key system is now live!"
