# Security Policy

## Reporting a Vulnerability

**DO NOT** open a public GitHub issue for security vulnerabilities.

Report security vulnerabilities privately to **security@mycryptosignal.com**.

### What to include

1. **Description** of the vulnerability
2. **Steps to reproduce**
3. **Potential impact** (data exposure, service disruption, etc.)
4. **Suggested fix** (if available)

### Response timeline

- **Initial response:** within 48 hours
- **Status update:** within 7 days
- **Resolution target:** within 30 days for critical issues

We follow coordinated disclosure: you report privately, we acknowledge and investigate, we
develop and test a fix, we release it, and we disclose the details after users have had time to
update.

## Scope

This repository contains the **public frontend** of mycryptosignal.com — a static site that reads
the public API at build time. It contains no secrets and no server-side code.

The data engine, the API gateway, and the operating systems behind the publication are **private**
and are not published here. Vulnerabilities in the operated service (the public API at
api.mycryptosignal.workers.dev) should still be reported to security@mycryptosignal.com.

## Security practices

- **No secrets in this repository.** If you find a committed key, token, or credential, report it
  immediately — do not use it.
- **The frontend ships no client-side API calls** and no secrets to the browser. The public API
  key used at build time is a limited, read-only token.
- **Dependencies** are audited with `npm audit` and Dependabot.

## Contact

- Security: security@mycryptosignal.com
- General: support@mycryptosignal.com
