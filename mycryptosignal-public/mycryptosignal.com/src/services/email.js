/**
 * Email Service using Cloudflare Email Routing
 * 
 * Cloudflare Email Routing allows sending emails from your domain
 * Setup required:
 * 1. Add email routing in Cloudflare dashboard
 * 2. Create destination addresses
 * 3. Configure DNS records (MX, TXT for SPF)
 * 
 * This service constructs email content to be sent via MailChannels
 * (Cloudflare's email delivery partner)
 */

export class EmailService {
  constructor(env) {
    this.env = env;
    this.fromEmail = env.FROM_EMAIL || 'noreply@mycryptosignal.com';
    this.fromName = 'MyCryptoSignal';
  }

  /**
   * Send API key to approved user
   */
  async sendApiKey(to, apiKey, organizationName, tier) {
    const subject = '🔑 Your MyCryptoSignal API Key is Ready';
    
    const html = this.buildApiKeyEmail(apiKey, organizationName, tier);
    const text = this.buildApiKeyEmailText(apiKey, organizationName, tier);

    return await this.send(to, subject, html, text);
  }

  /**
   * Send rejection notification
   */
  async sendRejection(to, reason) {
    const subject = 'MyCryptoSignal API Key Request Update';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>API Key Request Update</h2>
        <p>Thank you for your interest in MyCryptoSignal API.</p>
        <p>Unfortunately, we're unable to approve your API key request at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you have any questions, please reply to this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          MyCryptoSignal - AI-Powered Crypto Signals<br>
          <a href="https://mycryptosignal.com">mycryptosignal.com</a>
        </p>
      </div>
    `;

    const text = `
API Key Request Update

Thank you for your interest in MyCryptoSignal API.

Unfortunately, we're unable to approve your API key request at this time.
${reason ? `\nReason: ${reason}` : ''}

If you have any questions, please reply to this email.

---
MyCryptoSignal - AI-Powered Crypto Signals
mycryptosignal.com
    `.trim();

    return await this.send(to, subject, html, text);
  }

  /**
   * Build HTML email for API key delivery
   */
  buildApiKeyEmail(apiKey, organizationName, tier) {
    const tierLimits = this.getTierLimits(tier);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-family: Arial, sans-serif;">
                🔑 Your API Key is Ready!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-family: Arial, sans-serif; font-size: 16px; color: #333;">
                Hello ${organizationName},
              </p>
              
              <p style="margin: 0 0 20px; font-family: Arial, sans-serif; font-size: 16px; color: #333;">
                Your API key for MyCryptoSignal has been approved and is ready to use! 🎉
              </p>
              
              <!-- API Key Box -->
              <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 10px; font-family: Arial, sans-serif; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">
                  Your API Key
                </p>
                <code style="display: block; font-family: 'Courier New', monospace; font-size: 14px; color: #333; word-break: break-all; background-color: #fff; padding: 15px; border-radius: 4px;">
                  ${apiKey}
                </code>
                <p style="margin: 15px 0 0; font-family: Arial, sans-serif; font-size: 12px; color: #e74c3c;">
                  ⚠️ Keep this key secret! Never share it publicly or commit it to version control.
                </p>
              </div>
              
              <!-- Tier Info -->
              <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-family: Arial, sans-serif; font-size: 16px; color: #333; font-weight: bold;">
                  ${tier.toUpperCase()} Tier Limits
                </p>
                <ul style="margin: 0; padding-left: 20px; font-family: Arial, sans-serif; font-size: 14px; color: #555;">
                  <li>${tierLimits.rpm} requests per minute</li>
                  <li>${tierLimits.rpd.toLocaleString()} requests per day</li>
                  <li>${tierLimits.monthly === -1 ? 'Unlimited' : tierLimits.monthly.toLocaleString()} requests per month</li>
                </ul>
              </div>
              
              <!-- Quick Start -->
              <h2 style="margin: 30px 0 15px; font-family: Arial, sans-serif; font-size: 20px; color: #333;">
                Quick Start
              </h2>
              
              <p style="margin: 0 0 15px; font-family: Arial, sans-serif; font-size: 14px; color: #555;">
                Include your API key in the <code>X-API-Key</code> header:
              </p>
              
              <pre style="background-color: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 13px; margin: 0 0 20px;">
curl -H "X-API-Key: ${apiKey.substring(0, 20)}..." \\
     https://mycryptosignal.com/api/signals/latest</pre>
              
              <!-- Documentation Link -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://mycryptosignal.com/api-docs.html" 
                   style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;">
                  View Full Documentation
                </a>
              </div>
              
              <!-- Attribution Reminder -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #856404;">
                  <strong>Attribution Required:</strong> Please attribute MyCryptoSignal in your application or documentation.
                  Example: "Powered by <a href="https://mycryptosignal.com" style="color: #667eea;">MyCryptoSignal</a>"
                </p>
              </div>
              
              <p style="margin: 20px 0 0; font-family: Arial, sans-serif; font-size: 16px; color: #333;">
                Happy trading! 🚀
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="margin: 0 0 10px; font-family: Arial, sans-serif; font-size: 14px; color: #666;">
                Questions? Email us at <a href="mailto:support@mycryptosignal.com" style="color: #667eea;">support@mycryptosignal.com</a>
              </p>
              <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #999;">
                MyCryptoSignal - AI-Powered Crypto Signals<br>
                <a href="https://mycryptosignal.com" style="color: #667eea;">mycryptosignal.com</a> | 
                <a href="https://x.com/mycryptosignal" style="color: #667eea;">@mycryptosignal</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Build plain text email for API key delivery
   */
  buildApiKeyEmailText(apiKey, organizationName, tier) {
    const tierLimits = this.getTierLimits(tier);
    
    return `
🔑 Your API Key is Ready!

Hello ${organizationName},

Your API key for MyCryptoSignal has been approved and is ready to use!

YOUR API KEY:
${apiKey}

⚠️ Keep this key secret! Never share it publicly or commit it to version control.

${tier.toUpperCase()} TIER LIMITS:
- ${tierLimits.rpm} requests per minute
- ${tierLimits.rpd.toLocaleString()} requests per day
- ${tierLimits.monthly === -1 ? 'Unlimited' : tierLimits.monthly.toLocaleString()} requests per month

QUICK START:

Include your API key in the X-API-Key header:

curl -H "X-API-Key: ${apiKey}" \\
     https://mycryptosignal.com/api/signals/latest

DOCUMENTATION:
https://mycryptosignal.com/api-docs.html

ATTRIBUTION REQUIRED:
Please attribute MyCryptoSignal in your application or documentation.
Example: "Powered by MyCryptoSignal (https://mycryptosignal.com)"

Happy trading! 🚀

---
Questions? Email us at support@mycryptosignal.com

MyCryptoSignal - AI-Powered Crypto Signals
https://mycryptosignal.com | @mycryptosignal
    `.trim();
  }

  /**
   * Get tier limits for display
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
   * Send email via MailChannels (Cloudflare Workers integration)
   */
  async send(to, subject, html, text) {
    try {
      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
            },
          ],
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          subject: subject,
          content: [
            {
              type: 'text/plain',
              value: text,
            },
            {
              type: 'text/html',
              value: html,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Email send failed: ${response.status} ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }
}
