# Security Policy

## Supported versions

Security fixes target the latest released version and the current `main`
branch. Self-hosters should upgrade promptly and keep PostgreSQL, Node.js,
container images, identity configuration, and reverse proxies patched.

## Reporting a vulnerability

Use the repository's **Security → Report a vulnerability** flow to open a
private GitHub Security Advisory. Do not open a public issue or publish a proof
of concept before a fix is available.

Include the affected version, deployment mode, reproduction steps, a minimal
proof of concept, expected impact, and any known mitigations. We aim to
acknowledge actionable reports within 72 hours and coordinate disclosure with
the reporter.

## Scope

In scope are authentication and authorization bypasses, cross-workspace data
access, credential disclosure, publishing without required consent, unsafe
provider callbacks, injection, and exploitable insecure defaults.

Operator misconfiguration, unsupported old releases, and vulnerabilities solely
in third-party infrastructure are generally out of scope unless Delulu ships an
unsafe default that causes the exposure.

## Self-hosting responsibilities

Keep the API and app behind TLS, use independent high-entropy signing and
encryption secrets, restrict database access, configure exact callback URLs,
back up encrypted data, and never expose development ports directly.
