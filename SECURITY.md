# Security Policy

## About This Template

This is a **backend project template**. If you are the maintainer of a project derived
from this template, replace this file with your project-specific security policy.

The sections below serve as a starting point for your own security policy.

---

## Supported Versions

This table applies to the upstream template repository. Downstream projects should
define their own supported version matrix.

| Version        | Supported                          |
| -------------- | ---------------------------------- |
| latest (main)  | ✅ Security updates applied        |
| older branches | ❌ Not supported — upgrade to main |

> **For downstream projects**: Replace this table with your own release-based version
> support matrix (e.g., which minor/patch releases receive security backports).

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities via public GitHub Issues.**

We use [GitHub Private Security Advisories](https://github.com/locnguyen0904/backend-template/security/advisories/new)
to handle vulnerability reports confidentially.

### What to Include in Your Report

- A clear description of the vulnerability
- Steps to reproduce (proof-of-concept, if available)
- Affected versions or configurations
- Potential impact assessment
- Any suggested mitigations or patches (optional but appreciated)

### Response Timeline

| Stage                          | Target Time                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| Initial acknowledgement        | Within **72 hours** of submission                                         |
| Triage and severity assessment | Within **7 days**                                                         |
| Fix or mitigation              | Within **30 days** for critical/high severity; **90 days** for medium/low |
| Public disclosure              | Coordinated with reporter after fix is available                          |

We follow a **coordinated disclosure** model. We ask that you do not publicly disclose
the vulnerability until we have had the opportunity to investigate and release a fix.

---

## Disclosure Policy

Once a fix is available:

1. We will create a GitHub Security Advisory with full details
2. We will credit the reporter (unless anonymity is requested)
3. We will tag a new release documenting the fix in the changelog
4. Public disclosure happens simultaneously with or after the fix release

---

## Scope

### In Scope

- Vulnerabilities in backend source code under `src/`
- Authentication and authorization bypass
- Injection vulnerabilities (SQL, NoSQL, command injection)
- Sensitive data exposure
- Security misconfigurations in Docker Compose or environment variable handling
- Dependency vulnerabilities in direct dependencies (`package.json`)

### Out of Scope

- Vulnerabilities in transitive dependencies (report to the dependency maintainer)
- Social engineering attacks
- Physical attacks
- Issues in forked/derived projects (report to the derived project maintainer)
- Denial-of-service attacks requiring significant resources

---

## Security Best Practices for Derived Projects

If you are using this template as a starting point, ensure you:

- Set a strong, randomly generated `JWT_SECRET` (minimum 32 characters)
- Rotate secrets regularly and never commit `.env` files
- Review and tighten `ALLOWED_ORIGINS` in production
- Enable Trivy or similar dependency scanning in your CI pipeline
- Set `OTEL_ENABLED=true` and route traces to your observability platform
- Review and customise rate limits in `src/middlewares/rate-limit.middleware.ts`
