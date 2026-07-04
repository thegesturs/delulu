# Unified Integrations Spec

Specification for consolidating Delulu's social-platform integration layer into `packages/integrations`.

## Start here

Open **[`files/index.html`](./files/index.html)** in a browser — it links to all spec sections.

## Contents (`files/`)

| File | Topic |
|------|-------|
| `index.html` | Hub — navigation and phase status |
| `01-overview.html` | Problem, goals, success criteria |
| `02-decisions.html` | Locked architectural decisions |
| `03-architecture.html` | Package layout, consumer map |
| `04-types-and-api.html` | `PlatformIntegration` interface |
| `05-implementation-plan.html` | Phases 0–5, file inventory |
| `06-migration-checklist.html` | Add a platform in ≤5 steps |
| `07-out-of-scope.html` | Explicit v1 cuts |

Shared styles: `files/_shared.css`

## Review

Before implementation, run [`agent-review.md`](./agent-review.md) against all HTML files in `files/`.