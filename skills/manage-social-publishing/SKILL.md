---
name: manage-social-publishing
description: Set up and operate Delulu Social through its agent-first CLI or hosted MCP tools. Use for account authorization, workspace selection, social account connection or removal, paid onboarding, usage checks, media upload or import, drafting, multi-account publishing, scheduling, listing or inspecting posts, editing, deleting, retrying failed targets, and handling review workflows or publishing results.
---

# Manage Social Publishing

Prefer hosted MCP tools when they are available. Otherwise use the `delulu`
CLI. Never print, paste, log, or manually copy access or refresh tokens.

## Bootstrap the CLI

When hosted MCP tools are unavailable and `delulu` is not on `PATH`:

1. Check `node --version`. The CLI requires Node.js 20 or newer. If the runtime
   is missing or older, explain the requirement and help the user install or
   select a compatible Node.js version before continuing.
2. Run `npm install --global delulu-cli`, then verify `delulu --version`.
   Do not use `sudo`. If global installation is blocked by permissions, report
   the error and ask the user how they prefer to manage their Node.js tools.
3. Continue setup from `delulu`; do not ask the user to repeat their original
   setup request.

## Choose the surface

- Use MCP for remote URL media and basic setup, account, post, subscription,
  and usage operations.
- Use the CLI for local files, account disconnection, per-target retries, review
  actions, or a complete single-command publishing flow.
- Run `delulu help <command>` when syntax or fields are uncertain. Do not guess
  removed commands or unsupported flags.

## Establish context

1. Start with a read: run `delulu`, or call `get_setup_status` and
   `list_workspaces` when needed.
2. Resolve the workspace before any mutation. For CLI use, run
   `delulu workspace`; change it with `delulu workspace use <selector>` and
   complete the new approval ceremony. For MCP, pass `workspaceId` whenever
   more than one workspace is possible.
3. Inspect live role, onboarding, connected accounts, subscription, quota,
   pending reviews, and failures. Treat returned state as authoritative.
4. Ask only for missing choices that materially affect the action: workspace,
   target accounts, content, media, intent, schedule/timezone, privacy, or
   billing selection.

## Authorize and complete setup

1. For MCP, call a tool and follow the host OAuth flow if requested. For CLI,
   run `delulu login`, surface the verification URL and code, and wait for the
   user to approve access.
2. List accounts with `delulu accounts` or `list_accounts` before connecting a
   duplicate. Connect with `delulu connect <platform>` or `connect_account`,
   surface the authorization URL, and inspect account/setup status after the
   callback. Some platforms require a second account-selection step.
3. When payment is outstanding, collect plan (`ECHO` or `VIBE`), interval
   (`MONTHLY` or `YEARLY`), and currency (`USD` or `INR`). Run
   `delulu subscribe` or call `create_checkout`, surface the checkout URL, and
   wait for confirmation.
4. Re-run the setup read. Do not claim onboarding is complete until it returns
   `onboardingComplete: true` after both a social connection and confirmed
   payment.

## Prepare content

- Preserve the user's wording and links unless asked to rewrite them. Never
  invent endorsements, claims, tags, mentions, or media rights.
- Use exactly one CLI content source: positional caption, `--file`, or stdin.
  Prefer `--file` or stdin for long or shell-sensitive text.
- Resolve targets with `delulu accounts`. Prefer the canonical
  `platform:connection-id` selector. Raw IDs, a unique platform or username,
  and `platform@username` are aliases; if ambiguous, present the canonical
  choices instead of guessing.
- Upload local paths or public HTTPS URLs inline with `--media`, or prepare
  reusable media with `delulu upload`. With MCP, call `import_media` first and
  wait for a completed workspace media ID before `create_post`.
- Supply alt text when the user provides it or when it can be stated
  objectively from the media. Do not infer sensitive attributes.
- Use multiple MCP content segments for supported thread-style posts. Use the
  web editor for complex multi-segment edits that the CLI rejects.
- Treat platform validation errors as instructions to revise the request. Do
  not silently drop targets, media, or content to force success.

## Create a draft, schedule, or publish

Prefer the CLI's atomic flow:

```sh
delulu post "Caption" --to linkedin:connection_123 --media video.mp4 --draft
delulu post "Caption" --to linkedin:connection_123 --at "2026-07-18T10:00:00Z"
delulu post "Caption" --to linkedin:connection_123 --to x:connection_456 --now
```

- Default to a draft only when the user has not requested a delivery intent.
  Do not turn a request to draft or schedule into an immediate publication.
- Before `--now`, verify the final content, targets, media, and privacy from the
  user's request. If immediate public delivery was not explicit, stop at a
  draft and ask before publishing.
- Use an absolute schedule timestamp. Confirm the timezone when it is not clear
  from the request or established context, and restate the resolved local time
  and timezone in the result.
- With MCP, call `create_post` exactly once using explicit `draft`, `schedule`,
  or `publish_now` intent. Do not call `publish_post_now` after creating with
  `publish_now`; reserve it for an existing prepared post.
- Respect role behavior. An editor may receive `pending_review`; report it and
  never bypass or misrepresent review state.

## Operate the lifecycle

- List and inspect: use `delulu posts [--status ...]`, `delulu show <post-id>`,
  `list_posts`, or `get_post`. Paginate rather than assuming the first page is
  complete.
- Edit: use `delulu edit <post-id>` for drafts or scheduled posts, or
  `update_post` with only intended changes. Supplied CLI targets or media
  replace existing values, so inspect the post first.
- Publish an existing draft: use `delulu publish <post-id> --now` or
  `publish_post_now` only after the user has authorized immediate delivery.
- Review: use `delulu reviews`, then perform exactly one explicit action with
  `delulu review <post-id> --approve|--reject|--comment|--submit|--withdraw`.
  Never approve or reject without the user's requested decision.
- Delete or disconnect: inspect the exact resource first. Add required `--yes`
  only when the user explicitly authorized that deletion or disconnection.
- Usage: use `delulu usage`, `get_usage`, or `get_subscription`; distinguish
  pooled workspace usage from plan limits.

## Handle retries and results

- The CLI journals a stable operation key. Re-run an identical command for a
  retry; use `--new` only when the user explicitly wants a distinct duplicate
  operation.
- Preserve the same idempotency key for network retries. Retry automatically
  only when the error says `retryable: true`; otherwise follow the returned
  remediation or ask the user when content or account changes are required.
- If publication is still `publishing`, poll the original post. Do not update,
  reschedule, or recreate it while it is in progress.
- For `partially_failed` or `failed`, inspect every target. Run
  `delulu retry <post-id>` or `--target <target-id>` only for failed targets;
  never repeat successful targets.
- Treat CLI exit code, machine `status`, post state, and target states as
  authoritative. Exit code `8` means partial target failure; `9` means accepted
  but not terminal before timeout, not necessarily failed.
- Claim delivery only when the post and relevant targets are published.
  Otherwise report the exact state, successful and failed targets, retryability,
  platform URLs when returned, and the safest next action.
- Piped CLI output defaults to TOON. Use `--json` when strict JSON is required
  and `--full` only when truncated documented fields are needed.
