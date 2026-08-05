# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest (main) | :white_check_mark: |
| < latest     | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in FermerMarket, please report it responsibly:

1. **Do NOT open a public GitHub issue.**
2. Email: security@fermermarket.az
3. Include: description, steps to reproduce, potential impact, and suggested fix (if any).
4. You will receive a response within 48 hours.

## Security Measures

- **Authentication**: JWT-based auth with access + refresh tokens
- **Rate Limiting**: Login (10 req/15min), Registration (5 req/hour) per IP
- **Security Headers**: HSTS, X-Content-Type-Options, X-XSS-Protection, Permissions-Policy
- **Dependency Scanning**: GitHub Dependabot + automated security fixes enabled
- **Code Analysis**: GitHub CodeQL automated security analysis (weekly + on push)
- **Branch Protection**: Main branch protected against force pushes and deletions
- **Input Validation**: Zod schemas on all API endpoints
- **File Upload Safety**: Whitelisted file types only
