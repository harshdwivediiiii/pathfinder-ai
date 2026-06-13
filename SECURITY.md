# Security Policy

## Supported Versions

The following versions of Pathfinder AI are currently receiving security updates:

| Version | Supported          |
| ------- | ------------------ |
| `main` (latest) | ✅ Yes |
| Older branches  | ❌ No  |

We recommend always running the latest code from the `main` branch or the most recent deployment on Vercel.

---

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Disclosing security issues publicly before a fix is in place puts all users of Pathfinder AI at risk. Instead, use one of the private channels below.

### Option 1 — GitHub Private Security Advisory (Preferred)

Use GitHub's built-in private disclosure flow:

1. Go to the [Security tab](https://github.com/harshdwivediiiii/pathfinder-ai/security) of this repository.
2. Click **"Report a vulnerability"**.
3. Fill in the advisory form with as much detail as possible.

This keeps the report private and visible only to maintainers until a fix is released.

### Option 2 — Email

Send a detailed report directly to the maintainer:

📧 **harshvardhandwivedi18@gmail.com**

Use the subject line: `[SECURITY] Pathfinder AI – <brief description>`

Encrypt your message with PGP if the content is highly sensitive (key available on request).

---

## What to Include in Your Report

To help us triage and resolve the issue quickly, please include:

- **Description** – A clear summary of the vulnerability and its potential impact.
- **Steps to reproduce** – A minimal, reliable reproduction path (URL, payload, request/response, screenshots).
- **Environment** – Browser, OS, Node.js version, deployment target (local / Vercel), and any relevant config.
- **Impact assessment** – What data or functionality could be compromised? (e.g., authentication bypass, data exfiltration, privilege escalation)
- **Suggested fix** *(optional)* – If you have a proposed patch or mitigation.

---

## Response Timeline

| Stage | Target timeframe |
|---|---|
| Acknowledgement of report | Within **48 hours** |
| Initial triage and severity assessment | Within **5 business days** |
| Status update / patch ETA | Within **10 business days** |
| Public disclosure (after fix) | Coordinated with reporter |

We aim to resolve critical vulnerabilities within **14 days** of confirmed reproduction.

---

## Sensitive Areas of the Codebase

The following areas handle sensitive data and are especially important from a security perspective:

### Authentication — Clerk
Pathfinder AI uses [Clerk.dev](https://clerk.dev) for user authentication. Issues such as session fixation, token leakage, or broken auth flows in `app/` and `middleware.js` should be reported privately.

### Database — Prisma / PostgreSQL
The `prisma/` directory contains the database schema. SQL injection vectors, insecure queries, or privilege escalation through the ORM layer are in scope.

### AI Inputs — Gemini API
User-supplied text is passed to the Gemini API. Prompt injection attacks that cause unintended data disclosure or manipulation are in scope.

### Environment Variables and Credentials

> ⚠️ **Never commit real credentials to the repository.**

The `.env.example` file shows the shape of required environment variables — it must only ever contain placeholder values. Real secrets belong in `.env.local` (excluded via `.gitignore`) or in your Vercel / hosting environment.

Sensitive keys include:

```
DATABASE_URL              # PostgreSQL connection string
CLERK_SECRET_KEY          # Clerk backend secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
GEMINI_API_KEY            # Google Gemini API key
```

If you discover that real credentials have been accidentally committed or leaked, please report it immediately via the private channels above.

---

## Out of Scope

The following are generally **not** considered security vulnerabilities for this project:

- Theoretical or unproven vulnerabilities without a working proof of concept.
- Issues in third-party services (Clerk, Vercel, Gemini) — please report those directly to the respective vendor.
- Rate limiting or brute-force issues against Clerk's auth endpoints (report to Clerk).
- Missing HTTP security headers not yet implemented (open a regular issue instead).
- Self-XSS that requires the reporter to attack their own account.

---

## What Not to Do

- **Do not** open a public GitHub Issue for a security vulnerability.
- **Do not** post details in Discussions, Discord, or any public forum before coordinating disclosure.
- **Do not** attempt to access, modify, or delete data belonging to other users while researching the issue.
- **Do not** perform denial-of-service testing against the production deployment.

---

## Acknowledgements

We are grateful to security researchers and contributors who responsibly disclose vulnerabilities. With your permission, we will credit you in the release notes when the fix is published.

---

*This policy follows the principles of [Responsible Disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure). Thank you for helping keep Pathfinder AI safe for everyone.*
