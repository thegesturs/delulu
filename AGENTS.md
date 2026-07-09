# Agent Instructions

## Reference Repositories

This project keeps read-only reference material for coding agents under
`~/.zuse/reference-repos/` — external repositories checked out locally so
agents can consult real, idiomatic source instead of guessing.

- Prefer examples and patterns from the reference source over generated
  guesses or web search results.
- Do not edit files under `~/.zuse/reference-repos/` unless explicitly asked.
- Do not import from `~/.zuse/reference-repos/`; application code must
  continue importing from normal package dependencies.
- Manage reference checkouts with `bun run sync:refs`; use
  `bun run sync:refs --repo <id>` to sync one configured repository.
- When updating a dependency that has a configured reference checkout, sync
  that checkout in the same change so `~/.zuse/reference-repos/` matches the
  installed dependency version.
- When writing Effect code, read
  `~/.zuse/reference-repos/effect-smol/LLMS.md` first and inspect
  `~/.zuse/reference-repos/effect-smol/` for examples of idiomatic usage,
  tests, module structure, and API design.

## Core Priorities

**Performance first.**
**Reliability first.**

Keep behavior predictable under load and during failures (session restarts,
reconnects, partial streams). If a tradeoff is required, choose correctness
and robustness over short-term convenience.

## Maintainability

Long-term maintainability is a core priority. Before adding new
functionality, check whether shared logic can be extracted to a separate
module. Duplicate logic across multiple files is a code smell and should be
avoided. Don't be afraid to change existing code — don't take shortcuts by
bolting on local, one-off logic to solve a problem that already has a
shared solution elsewhere.
