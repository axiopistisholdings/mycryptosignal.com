#!/usr/bin/env node
/**
 * Script to create B2B API keys for institutional partners
 * Usage: CLOUDFLARE_API_TOKEN=<token> node scripts/create-api-key.js <company-name> <email> [tier] [company-id]
 * 
 * Tiers: beta (default), startup, growth, enterprise
 * 
 * Examples:
 *   node scripts/create-api-key.js "Acme Corp" contact@acme.com
 *   node scripts/create-api-key.js "Beta Partner" partner@example.com beta 123
 */

import crypto from 'crypto';
import { execSync } from 'child_process';

function generateApiKey() {
  // Generate a secure random API key (32 bytes = 64 hex characters)
  return 'mcs_' + crypto.randomBytes(32).toString('hex');
}

async function hashApiKey(apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hashBuffer).toString('hex');
}

function getTierLimits(tier) {
  const limits = {
    beta: {
      rate_limit_rpm: 60,
      rate_limit_rpd: 10000,
      monthly_quota: 300000
    },
    startup: {
      rate_limit_rpm: 100,
      rate_limit_rpd: 50000,
      monthly_quota: 1000000
    },
    growth: {
      rate_limit_rpm: 500,
      rate_limit_rpd: 200000,
      monthly_quota: 5000000
    },
    enterprise: {
      rate_limit_rpm: 2000,
      rate_limit_rpd: 1000000,
      monthly_quota: -1 // unlimited
    }
  };
  return limits[tier] || limits.beta;
}

async function insertIntoD1(apiKey, orgName, email, tier, companyId) {
  const keyHash = await hashApiKey(apiKey);
  const limits = getTierLimits(tier);
  const now = Math.floor(Date.now() / 1000);
  
  // Calculate quota reset (first of next month)
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  const quotaResetAt = Math.floor(nextMonth.getTime() / 1000);
  
  const sql = `
    INSERT INTO api_keys (
      key_hash, 
      organization_name, 
      contact_email, 
      tier, 
      company_id,
      rate_limit_rpm, 
      rate_limit_rpd, 
      monthly_quota,
      usage_this_month,
      quota_reset_at,
      is_active
    ) VALUES (
      '${keyHash}',
      '${orgName.replace(/'/g, "''")}',
      '${email}',
      '${tier}',
      ${companyId || 'NULL'},
      ${limits.rate_limit_rpm},
      ${limits.rate_limit_rpd},
      ${limits.monthly_quota},
      0,
      ${quotaResetAt},
      1
    )
  `.trim();
  
  try {
    const command = `npx wrangler d1 execute mycryptosignal-db --remote --command "${sql}"`;
    execSync(command, { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    return true;
  } catch (error) {
    console.error('\n❌ Failed to insert key into D1:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: CLOUDFLARE_API_TOKEN=<token> node scripts/create-api-key.js <company-name> <email> [tier] [company-id]');
    console.error('\nTiers: beta (default), startup, growth, enterprise');
    console.error('\nExample: node scripts/create-api-key.js "Acme Corp" contact@acme.com beta');
    process.exit(1);
  }

  if (!process.env.CLOUDFLARE_API_TOKEN) {
    console.error('❌ Error: CLOUDFLARE_API_TOKEN environment variable is required');
    console.error('Set it with: export CLOUDFLARE_API_TOKEN=your-token');
    process.exit(1);
  }

  const [orgName, email, tier = 'beta', companyId] = args;
  const limits = getTierLimits(tier);
  const apiKey = generateApiKey();

  console.log('\n🔑 === API Key Generated ===\n');
  console.log('API Key:', apiKey);
  console.log('Organization:', orgName);
  console.log('Contact:', email);
  console.log('Tier:', tier.toUpperCase());
  console.log('Rate Limits:', limits.rate_limit_rpm, 'req/min,', limits.rate_limit_rpd, 'req/day');
  console.log('Monthly Quota:', limits.monthly_quota === -1 ? 'Unlimited' : limits.monthly_quota.toLocaleString(), 'requests');
  
  console.log('\n📝 Storing in D1 database...\n');
  
  const success = await insertIntoD1(apiKey, orgName, email, tier, companyId);
  
  if (success) {
    console.log('\n✅ API key successfully created and stored!\n');
    console.log('⚠️  IMPORTANT: Save this API key securely. It cannot be retrieved again.');
    console.log('\n📋 Send to partner:\n');
    console.log(`API Key: ${apiKey}`);
    console.log(`Documentation: https://mycryptosignal.axiopistis-systems.workers.dev/docs`);
    console.log(`Rate Limits: ${limits.rate_limit_rpm} req/min, ${limits.rate_limit_rpd} req/day`);
    console.log(`Monthly Quota: ${limits.monthly_quota === -1 ? 'Unlimited' : limits.monthly_quota.toLocaleString()} requests\n`);
  } else {
    console.log('\n❌ Failed to create API key. Please check errors above.\n');
    process.exit(1);
  }
}

main().catch(console.error);
