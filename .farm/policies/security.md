# Security Policy (Farm)
- No secrets in code, tests, or commits. Use env/Secrets Manager.
- Denylist patterns: passwords, tokens, private keys.
- Dependencies: run `npm audit` weekly, pin critical patches.
- LLM Redaction: mask emails, tokens, PII before agent context.
