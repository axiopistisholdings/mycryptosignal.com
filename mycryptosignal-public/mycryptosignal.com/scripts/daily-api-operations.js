#!/usr/bin/env node

/**
 * Daily Operations Script for API Key Management
 * 
 * Run this script daily (or via cron) to:
 * - Auto-approve trusted API key requests
 * - Send summary report
 * - Alert on suspicious activity
 * 
 * Usage:
 *   node scripts/daily-api-operations.js
 * 
 * Cron example (run at 9 AM daily):
 *   0 9 * * * cd /path/to/mycryptosignal && node scripts/daily-api-operations.js
 */

import { execSync } from 'child_process';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function query(sql) {
  try {
    const command = `echo "${sql.replace(/"/g, '\\"')}" | npx wrangler d1 execute mycryptosignal-db --local --json`;
    const output = execSync(command, { encoding: 'utf8' });
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('🤖 Daily API Key Operations', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  const startTime = Date.now();

  // 1. Check pending requests
  log('1️⃣  Checking pending API key requests...', 'yellow');
  const pendingRequests = query(`
    SELECT COUNT(*) as count FROM api_key_requests WHERE status = 'pending'
  `);
  const pendingCount = pendingRequests[0]?.count || 0;
  log(`   Found ${pendingCount} pending request(s)\n`, pendingCount > 0 ? 'green' : 'reset');

  // 2. Auto-approve trusted requests
  if (pendingCount > 0) {
    log('2️⃣  Running auto-approval for trusted requests...', 'yellow');
    try {
      const output = execSync('node scripts/approve-api-keys.js --auto', { encoding: 'utf8' });
      console.log(output);
    } catch (error) {
      log('   ⚠️  Auto-approval encountered an error', 'red');
      console.error(error.message);
    }
  } else {
    log('2️⃣  No pending requests to process\n', 'reset');
  }

  // 3. Get system stats
  log('3️⃣  Generating system statistics...', 'yellow');
  
  const totalKeys = query(`SELECT COUNT(*) as count FROM api_keys`)[0]?.count || 0;
  const activeKeys = query(`SELECT COUNT(*) as count FROM api_keys WHERE is_active = 1`)[0]?.count || 0;
  const requestsToday = query(`
    SELECT COUNT(*) as count 
    FROM api_usage_logs 
    WHERE date(timestamp, 'unixepoch') = date('now')
  `)[0]?.count || 0;
  
  const requestsThisMonth = query(`
    SELECT SUM(current_month_usage) as total 
    FROM api_keys 
    WHERE is_active = 1
  `)[0]?.total || 0;

  log(`   Total API keys: ${totalKeys}`, 'green');
  log(`   Active keys: ${activeKeys}`, 'green');
  log(`   Requests today: ${requestsToday}`, 'green');
  log(`   Requests this month: ${requestsThisMonth}\n`, 'green');

  // 4. Check for quota issues
  log('4️⃣  Checking for quota warnings...', 'yellow');
  const quotaWarnings = query(`
    SELECT organization_name, contact_email, 
           current_month_usage, monthly_quota,
           ROUND(current_month_usage * 100.0 / monthly_quota, 1) as usage_percent
    FROM api_keys 
    WHERE is_active = 1 
      AND monthly_quota > 0 
      AND current_month_usage >= monthly_quota * 0.8
    ORDER BY usage_percent DESC
  `);

  if (quotaWarnings.length > 0) {
    log(`   ⚠️  ${quotaWarnings.length} key(s) approaching quota limit:`, 'yellow');
    quotaWarnings.forEach(key => {
      log(`      ${key.organization_name} (${key.usage_percent}% used) - ${key.contact_email}`, 'yellow');
    });
    log('', 'reset');
  } else {
    log('   ✅ No quota warnings\n', 'green');
  }

  // 5. Check for suspicious activity
  log('5️⃣  Checking for suspicious activity...', 'yellow');
  
  // High error rate in last 24 hours
  const errorRates = query(`
    SELECT 
      api_key_id,
      COUNT(*) as total_requests,
      SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors,
      ROUND(SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as error_rate
    FROM api_usage_logs
    WHERE timestamp >= strftime('%s', 'now', '-1 day')
    GROUP BY api_key_id
    HAVING error_rate > 20
    ORDER BY error_rate DESC
  `);

  if (errorRates.length > 0) {
    log(`   ⚠️  ${errorRates.length} key(s) with high error rate (>20%):`, 'red');
    errorRates.forEach(key => {
      const keyDetails = query(`SELECT organization_name FROM api_keys WHERE id = ${key.api_key_id}`)[0];
      log(`      Key #${key.api_key_id} (${keyDetails?.organization_name || 'Unknown'}): ${key.error_rate}% errors (${key.errors}/${key.total_requests})`, 'red');
    });
    log('', 'reset');
  } else {
    log('   ✅ No suspicious activity detected\n', 'green');
  }

  // 6. Top API users today
  log('6️⃣  Top 5 API users today:', 'yellow');
  const topUsers = query(`
    SELECT 
      a.organization_name,
      a.tier,
      COUNT(*) as requests
    FROM api_usage_logs l
    JOIN api_keys a ON l.api_key_id = a.id
    WHERE date(l.timestamp, 'unixepoch') = date('now')
    GROUP BY l.api_key_id
    ORDER BY requests DESC
    LIMIT 5
  `);

  if (topUsers.length > 0) {
    topUsers.forEach((user, i) => {
      log(`   ${i + 1}. ${user.organization_name} (${user.tier}): ${user.requests} requests`, 'green');
    });
  } else {
    log('   No API usage today yet', 'reset');
  }
  log('', 'reset');

  // 7. Recent requests needing manual review
  log('7️⃣  Requests needing manual review:', 'yellow');
  const manualReview = query(`
    SELECT id, email, project_name, created_at
    FROM api_key_requests
    WHERE status = 'pending'
    ORDER BY created_at DESC
    LIMIT 5
  `);

  if (manualReview.length > 0) {
    log(`   ${manualReview.length} request(s) need manual review:\n`, 'yellow');
    manualReview.forEach(req => {
      const date = new Date(req.created_at * 1000).toISOString().split('T')[0];
      log(`   📋 Request #${req.id} - ${req.email}`, 'magenta');
      log(`      Project: ${req.project_name}`, 'reset');
      log(`      Submitted: ${date}`, 'reset');
      log(`      To approve: node scripts/approve-api-keys.js --approve ${req.id}`, 'blue');
      log(`      To reject:  node scripts/approve-api-keys.js --reject ${req.id} "reason"\n`, 'blue');
    });
  } else {
    log('   ✅ No requests pending review\n', 'green');
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log(`✅ Daily operations complete (${duration}s)`, 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  // Action items
  if (pendingCount > 0 || quotaWarnings.length > 0 || errorRates.length > 0 || manualReview.length > 0) {
    log('📌 Action Items:', 'yellow');
    if (manualReview.length > 0) {
      log(`   • Review ${manualReview.length} pending request(s) manually`, 'yellow');
    }
    if (quotaWarnings.length > 0) {
      log(`   • Contact ${quotaWarnings.length} user(s) about quota limits`, 'yellow');
    }
    if (errorRates.length > 0) {
      log(`   • Investigate ${errorRates.length} key(s) with high error rates`, 'yellow');
    }
    log('', 'reset');
  }
}

main().catch(console.error);
