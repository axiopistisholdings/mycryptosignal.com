#!/bin/bash
# Quick test post script

export CLOUDFLARE_API_TOKEN="cypVCEtGcP07mPyjtHx7bOWn9LmlB-hoT2kq-xmN"
ADMIN_TOKEN="admin-token-change-me-later"
WORKER_URL="https://mycryptosignal.axiopistis-systems.workers.dev"

echo "🚀 Sending Test X/Twitter Post"
echo "================================"
echo ""

# Step 1: Check if signals exist
echo "1. Checking for today's signals..."
SIGNAL_CHECK=$(curl -s "$WORKER_URL/api/signals" | grep -c "signals")

if [ "$SIGNAL_CHECK" -eq 0 ]; then
  echo "   No signals found. Generating signals first..."
  echo ""
  curl -X POST \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -s "$WORKER_URL/admin/generate-signals" | head -20
  echo ""
  echo "   ✅ Signals generated"
  sleep 3
fi

# Step 2: Send test post
echo ""
echo "2. Sending test X/Twitter post (morning highlights)..."
echo ""

RESPONSE=$(curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"morning"}' \
  -s "$WORKER_URL/admin/test-x-post")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "================================"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q "success.*true"; then
  echo "✅ SUCCESS! Test post sent to X/Twitter"
  echo ""
  echo "Check your X/Twitter account:"
  echo "https://twitter.com/YourHandle"
elif echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Error occurred:"
  echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', 'Unknown error'))" 2>/dev/null
else
  echo "⚠️  Response received but status unclear"
fi

echo ""
