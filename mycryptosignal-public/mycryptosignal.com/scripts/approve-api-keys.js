#!/usr/bin/env node

/**
 * API Key Approval Script
 * 
 * Hybrid approval process:
 * - Auto-approve: Trusted email domains pass spam check
 * - Manual review: Suspicious or unknown domains
 * 
 * Usage:
 *   node scripts/approve-api-keys.js --auto          # Auto-approve trusted requests
 *   node scripts/approve-api-keys.js --approve 123   # Manually approve request ID 123
 *   node scripts/approve-api-keys.js --reject 124 "Spam detected"
 *   node scripts/approve-api-keys.js --list          # List pending requests
 */

import crypto from 'crypto';
import { execSync } from 'child_process';

// Trusted email domains that auto-approve
const TRUSTED_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'protonmail.com',
  'icloud.com',
  'hey.com',
  // Corporate domains
  'company.com',
  // Educational
  '.edu',
  '.ac.uk'
];

// Spam indicators
const SPAM_KEYWORDS = [
  'buy followers',
  'cheap viagra',
  'crypto pump',
  'guaranteed profit',
  'get rich quick',
  'click here',
  'limited time offer',
  'act now',
  'forex trading',
  'binary options'
];

const SUSPICIOUS_PATTERNS = [
  /\d{5,}/, // Long numbers in use case
  /(.)\1{4,}/, // Repeated characters (aaaaa)
  /^[a-z]+\d+@/, // Username with numbers at end (spam123@)
  /free.*money/i,
  /urgent/i,
];

class ApiKeyApprovalService {
  constructor() {
    this.dbName = 'mycryptosignal-db';
  }

  /**
   * Execute D1 query
   */
  query(sql) {
    try {
      const command = `echo "${sql.replace(/"/g, '\\"')}" | npx wrangler d1 execute ${this.dbName} --local --json`;
      const output = execSync(command, { encoding: 'utf8' });
      
      // Parse wrangler output (removes colored output and extracts JSON)
      const jsonMatch = output.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Query error:', error.message);
      throw error;
    }
  }

  /**
   * List pending API key requests
   */
  async listPending() {
    const sql = `
      SELECT id, email, project_name, use_case, website, created_at 
      FROM api_key_requests 
      WHERE status = 'pending' 
      ORDER BY created_at ASC
    `;
    
    const requests = this.query(sql);
    
    if (requests.length === 0) {
      console.log('✅ No pending requests');
      return [];
    }

    console.log(`\n📋 ${requests.length} Pending Request(s):\n`);
    requests.forEach(req => {
      const date = new Date(req.created_at * 1000).toISOString().split('T')[0];
      console.log(`ID: ${req.id}`);
      console.log(`  Email: ${req.email}`);
      console.log(`  Project: ${req.project_name}`);
      console.log(`  Use Case: ${req.use_case.substring(0, 80)}...`);
      console.log(`  Website: ${req.website || 'N/A'}`);
      console.log(`  Submitted: ${date}`);
      console.log(`  Spam Score: ${this.calculateSpamScore(req)}/100\n`);
    });

    return requests;
  }

  /**
   * Calculate spam score (0-100, higher = more suspicious)
   */
  calculateSpamScore(request) {
    let score = 0;
    const text = `${request.use_case} ${request.project_name}`.toLowerCase();
    const email = request.email.toLowerCase();

    // Check email domain
    const domain = email.split('@')[1];
    const isTrustedDomain = TRUSTED_DOMAINS.some(trusted => 
      domain === trusted || domain.endsWith(trusted)
    );
    
    if (!isTrustedDomain) {
      score += 20;
    }

    // Check for spam keywords
    const keywordMatches = SPAM_KEYWORDS.filter(keyword => 
      text.includes(keyword)
    );
    score += keywordMatches.length * 15;

    // Check suspicious patterns
    const patternMatches = SUSPICIOUS_PATTERNS.filter(pattern => 
      pattern.test(text)
    );
    score += patternMatches.length * 10;

    // Check email username quality
    const username = email.split('@')[0];
    if (username.length < 3) score += 10;
    if (/^\d+$/.test(username)) score += 15; // All numbers
    if (!username.match(/[a-z]/i)) score += 10; // No letters

    // Check if use case is too short
    if (request.use_case.length < 20) score += 15;

    // Check if use case is too generic
    const genericPhrases = ['testing', 'personal use', 'learning', 'project'];
    const isGeneric = genericPhrases.some(phrase => text.includes(phrase));
    if (isGeneric && request.use_case.length < 50) score += 10;

    return Math.min(100, score);
  }

  /**
   * Auto-approve trusted requests (spam score < 30)
   */
  async autoApprove() {
    const pending = await this.listPending();
    
    let approved = 0;
    let skipped = 0;

    for (const request of pending) {
      const spamScore = this.calculateSpamScore(request);
      
      if (spamScore < 30) {
        console.log(`✅ Auto-approving request ${request.id} (${request.email}) - Spam Score: ${spamScore}`);
        await this.approve(request.id, 'auto');
        approved++;
      } else {
        console.log(`⚠️  Skipping request ${request.id} (${request.email}) - Spam Score: ${spamScore} (needs manual review)`);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  Approved: ${approved}`);
    console.log(`  Needs Review: ${skipped}`);
  }

  /**
   * Approve a request and generate API key
   */
  async approve(requestId, processedBy = 'manual') {
    // Get request details
    const sql = `SELECT * FROM api_key_requests WHERE id = ${requestId} AND status = 'pending'`;
    const requests = this.query(sql);
    
    if (requests.length === 0) {
      console.error(`❌ Request ${requestId} not found or already processed`);
      return;
    }

    const request = requests[0];
    
    // Generate API key
    const apiKey = this.generateApiKey();
    const keyHash = this.hashApiKey(apiKey);
    
    // Determine tier (beta for all free users)
    const tier = 'beta';
    const tierLimits = this.getTierLimits(tier);
    
    // Calculate quota reset date (first day of next month)
    const now = new Date();
    const quotaResetAt = Math.floor(new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() / 1000);

    // Insert API key
    const insertSql = `
      INSERT INTO api_keys (
        key_hash, organization_name, contact_email, tier, company,
        rpm_limit, rpd_limit, monthly_quota, quota_reset_at
      ) VALUES (
        '${keyHash}',
        '${this.escapeSql(request.project_name)}',
        '${this.escapeSql(request.email)}',
        '${tier}',
        ${request.website ? `'${this.escapeSql(request.website)}'` : 'NULL'},
        ${tierLimits.rpm},
        ${tierLimits.rpd},
        ${tierLimits.monthly},
        ${quotaResetAt}
      )
    `;
    
    this.query(insertSql);

    // Update request status
    const updateSql = `
      UPDATE api_key_requests 
      SET status = 'approved', 
          processed_at = ${Math.floor(Date.now() / 1000)},
          processed_by = '${processedBy}'
      WHERE id = ${requestId}
    `;
    
    this.query(updateSql);

    console.log(`\n✅ Request ${requestId} approved!`);
    console.log(`   Email: ${request.email}`);
    console.log(`   Tier: ${tier.toUpperCase()}`);
    console.log(`   API Key: ${apiKey}`);
    console.log(`\n📧 TODO: Send this API key to ${request.email}`);
    console.log(`   Command: node scripts/send-api-key-email.js ${request.email} "${apiKey}" "${tier}"\n`);

    return apiKey;
  }

  /**
   * Reject a request
   */
  async reject(requestId, reason = 'Did not meet requirements') {
    const updateSql = `
      UPDATE api_key_requests 
      SET status = 'rejected', 
          processed_at = ${Math.floor(Date.now() / 1000)},
          processed_by = 'manual',
          notes = '${this.escapeSql(reason)}'
      WHERE id = ${requestId} AND status = 'pending'
    `;
    
    const result = this.query(updateSql);
    
    if (result.meta && result.meta.changes === 0) {
      console.error(`❌ Request ${requestId} not found or already processed`);
      return;
    }

    console.log(`❌ Request ${requestId} rejected`);
    console.log(`   Reason: ${reason}`);
    console.log(`\n📧 TODO: Send rejection email to user\n`);
  }

  /**
   * Generate API key in format: mcs_<64-hex-chars>
   */
  generateApiKey() {
    const randomBytes = crypto.randomBytes(32);
    return 'mcs_' + randomBytes.toString('hex');
  }

  /**
   * Hash API key with SHA-256
   */
  hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Get tier limits
   */
  getTierLimits(tier) {
    const limits = {
      beta: { rpm: 60, rpd: 10000, monthly: 300000 },
      startup: { rpm: 100, rpd: 50000, monthly: 1000000 },
      growth: { rpm: 500, rpd: 200000, monthly: 5000000 },
      enterprise: { rpm: 2000, rpd: 1000000, monthly: -1 }
    };
    return limits[tier] || limits.beta;
  }

  /**
   * Escape SQL strings
   */
  escapeSql(str) {
    return str.replace(/'/g, "''");
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const service = new ApiKeyApprovalService();

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
API Key Approval Script

Usage:
  node scripts/approve-api-keys.js --list              List pending requests
  node scripts/approve-api-keys.js --auto              Auto-approve trusted requests
  node scripts/approve-api-keys.js --approve <id>      Manually approve request
  node scripts/approve-api-keys.js --reject <id> "reason"  Reject request
  node scripts/approve-api-keys.js --help              Show this help

Examples:
  node scripts/approve-api-keys.js --auto
  node scripts/approve-api-keys.js --approve 5
  node scripts/approve-api-keys.js --reject 6 "Spam detected"
    `);
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case '--list':
        await service.listPending();
        break;

      case '--auto':
        await service.autoApprove();
        break;

      case '--approve':
        if (!args[1]) {
          console.error('❌ Error: Request ID required');
          console.error('Usage: node scripts/approve-api-keys.js --approve <id>');
          process.exit(1);
        }
        await service.approve(parseInt(args[1]));
        break;

      case '--reject':
        if (!args[1]) {
          console.error('❌ Error: Request ID required');
          console.error('Usage: node scripts/approve-api-keys.js --reject <id> "reason"');
          process.exit(1);
        }
        const reason = args[2] || 'Did not meet requirements';
        await service.reject(parseInt(args[1]), reason);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error('Run with --help to see available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
