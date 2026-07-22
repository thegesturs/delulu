# Contributing to Delulu

Thanks for helping make agent-operated social publishing safer and more useful.

## Before opening a change

- Search existing issues and pull requests.
- Open an issue before large behavioral, schema, provider, or deployment work.
- Never include credentials, exported customer data, or real social tokens.
- Keep hosted and self-hosted behavior explicit in code and tests.

## Development setup

```bash
corepack enable
pnpm install
pnpm pg:up
pnpm pg:migrate
pnpm dev:app+api
```

Copy only the environment examples needed by the surfaces you are running. Use
test applications and accounts for provider work.

## Pull requests

1. Create a focused branch from `main`.
2. Add behavior-level tests for public contracts, permissions, publishing state,
   migrations, or deployment changes.
3. Run the focused package tests while working.
4. Before requesting review, run:

```bash
pnpm check
pnpm typecheck
pnpm test
```

Database changes must add an append-only migration and pass
`pnpm pg:migration-lint`. Never edit an already-released migration.

Provider changes must preserve idempotency, token encryption, retry
classification, and target-level failure reporting.

## Documentation

Update the README or `apps/docs/content/docs` whenever a public command,
contract, configuration value, deployment step, or limitation changes.

## Licensing

By contributing, you agree that your contribution is licensed under the
repository's AGPL-3.0-only license.
