#!/bin/bash

# Setup script for MyCryptoSignal Cloudflare Workers backend
# Run this after cloning the repository

set -e

echo "🚀 MyCryptoSignal Backend Setup"
echo "================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

echo "✅ Wrangler CLI detected"

# Create D1 database
echo ""
echo "📦 Creating D1 database..."
DB_OUTPUT=$(wrangler d1 create mycryptosignal-db)
echo "$DB_OUTPUT"

# Extract database ID (you'll need to manually update wrangler.toml with this)
echo ""
echo "⚠️  IMPORTANT: Copy the database_id from above and update wrangler.toml"
echo "   Replace 'placeholder' with the actual database_id"
echo ""
read -p "Press Enter after updating wrangler.toml..."

# Create KV namespace
echo ""
echo "📦 Creating KV namespace..."
KV_OUTPUT=$(wrangler kv:namespace create "KV")
echo "$KV_OUTPUT"

echo ""
echo "⚠️  IMPORTANT: Copy the KV namespace ID from above and update wrangler.toml"
echo "   Replace 'placeholder' with the actual KV id"
echo ""
read -p "Press Enter after updating wrangler.toml..."

# Initialize database schema
echo ""
echo "📊 Initializing database schema..."
wrangler d1 execute mycryptosignal-db --file=./schema.sql

# Seed coins data
echo ""
echo "🌱 Seeding coins data..."
node ./scripts/seed-coins.js

# Set up secrets
echo ""
echo "🔐 Setting up secrets..."
echo "You'll be prompted to enter API keys for each service."
echo ""

read -p "Enter CoinGecko API Key (or press Enter to skip): " COINGECKO_KEY
if [ ! -z "$COINGECKO_KEY" ]; then
    echo "$COINGECKO_KEY" | wrangler secret put COINGECKO_API_KEY
fi

read -p "Enter Alchemy API Key: " ALCHEMY_KEY
if [ ! -z "$ALCHEMY_KEY" ]; then
    echo "$ALCHEMY_KEY" | wrangler secret put ALCHEMY_API_KEY
fi

read -p "Enter Infura API Key: " INFURA_KEY
if [ ! -z "$INFURA_KEY" ]; then
    echo "$INFURA_KEY" | wrangler secret put INFURA_API_KEY
fi

read -p "Enter Cohere API Key (for AI enhancement): " COHERE_KEY
if [ ! -z "$COHERE_KEY" ]; then
    echo "$COHERE_KEY" | wrangler secret put COHERE_API_KEY
fi

echo ""
echo "Twitter/X API credentials (for signal publishing):"
read -p "Enter X API Key: " X_API_KEY
if [ ! -z "$X_API_KEY" ]; then
    echo "$X_API_KEY" | wrangler secret put X_API_KEY
fi

read -p "Enter X API Secret: " X_API_SECRET
if [ ! -z "$X_API_SECRET" ]; then
    echo "$X_API_SECRET" | wrangler secret put X_API_SECRET
fi

read -p "Enter X Access Token: " X_ACCESS_TOKEN
if [ ! -z "$X_ACCESS_TOKEN" ]; then
    echo "$X_ACCESS_TOKEN" | wrangler secret put X_ACCESS_TOKEN
fi

read -p "Enter X Access Secret: " X_ACCESS_SECRET
if [ ! -z "$X_ACCESS_SECRET" ]; then
    echo "$X_ACCESS_SECRET" | wrangler secret put X_ACCESS_SECRET
fi

read -p "Enter Admin Token (for manual triggers): " ADMIN_TOKEN
if [ ! -z "$ADMIN_TOKEN" ]; then
    echo "$ADMIN_TOKEN" | wrangler secret put ADMIN_TOKEN
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Test locally: wrangler dev"
echo "2. Deploy: wrangler deploy"
echo "3. Test data collection: curl -X POST https://your-worker.workers.dev/admin/collect -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'"
echo ""
