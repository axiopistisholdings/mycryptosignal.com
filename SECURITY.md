# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities to:

**Email:** security@mycryptosignal.com

### What to Include

When reporting a vulnerability, please include:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** (data exposure, financial risk, etc.)
4. **Suggested fix** (if available)
5. **Your contact information** for follow-up

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Resolution Target:** Within 30 days for critical issues

### Disclosure Policy

We follow coordinated disclosure:

1. You report the vulnerability privately
2. We acknowledge and investigate
3. We develop and test a fix
4. We release a security patch
5. We publicly disclose the vulnerability details (after users have had time to update)

## Security Best Practices

### For Contributors

- **Never commit secrets** (API keys, tokens, passwords)
- **Use environment variables** for sensitive configuration
- **Validate all inputs** from external sources
- **Follow OWASP guidelines** for web security
- **Keep dependencies updated** regularly

### For Users

- **Keep your API keys secure** - never share or commit them
- **Use HTTPS** for all API communications
- **Enable rate limiting** on your deployments
- **Monitor logs** for suspicious activity
- **Update regularly** to the latest version

## Known Security Considerations

### API Key Security

- API keys should be stored as environment variables
- Rotate keys regularly (every 90 days recommended)
- Use different keys for development and production

### Rate Limiting

- Implement rate limiting to prevent abuse
- Default: 100 requests per minute per API key

### Data Privacy

- We do not store user trading credentials
- Market data is aggregated and anonymized
- Logs are retained for 30 days maximum

### Third-Party Dependencies

We regularly audit dependencies using:
- `npm audit` for Node.js packages
- Dependabot for automated security updates
- Snyk for continuous monitoring

## Security Updates

Security updates are released as:
- **Critical:** Immediate patch release
- **High:** Patch within 7 days
- **Medium:** Included in next minor release
- **Low:** Included in next major release

Subscribe to our [security mailing list](mailto:security-updates@mycryptosignal.com) for notifications.

## Bug Bounty Program

We are planning to launch a bug bounty program. Check back soon for details.

## Compliance

This project aims to comply with:
- OWASP Top 10 security standards
- PCI DSS guidelines (for payment processing)
- GDPR (for EU users)

## Contact

For security concerns: security@mycryptosignal.com

For general questions: support@mycryptosignal.com

---

**Last Updated:** January 2026