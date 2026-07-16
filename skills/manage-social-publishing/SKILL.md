---
name: manage-social-publishing
description: Set up and operate Delulu Social through its CLI or hosted MCP tools. Use when a user wants to sign up or authorize an agent, choose a workspace, connect social accounts, complete paid onboarding, upload or import media, create drafts, schedule content, publish posts, or inspect publishing results.
---

# Manage Social Publishing

Use hosted MCP tools when they are already available. Otherwise install and run
the `delulu-cli` package. Never print, paste into conversation, or manually copy
access or refresh tokens.

## Authorize

1. Call an MCP tool. If the host requests authorization, follow its OAuth flow.
2. For CLI use, run `delulu login`. Surface the verification URL and code, then
   wait for the user to sign up or sign in and approve access.
3. Run `delulu workspace` or `list_workspaces`.
4. If the user chooses another workspace, run `delulu workspace use <selector>`
   and wait for explicit authorization. Never override a workspace-bound token.

## Complete setup

1. Run `delulu` or call `get_setup_status`.
2. Ask which supported social platforms to connect. For each choice, call
   `delulu connect <platform>` or `connect_account`. Surface the returned URL
   and wait for the callback result.
3. Ask for plan, monthly/yearly interval, and USD/INR currency. Call
   `delulu subscribe` or `create_checkout` and surface the checkout URL.
4. Re-run `delulu`. Do not claim onboarding is complete until it returns
   `onboardingComplete: true` after both a social connection and confirmed
   payment.

## Prepare and publish content

- Prefer the CLI's single-command flow. It resolves account selectors, uploads
  local media or imports public HTTPS URLs, creates the post with an atomic
  intent, and waits for the resulting target state:

  ```sh
  delulu post "Caption" --to linkedin --media video.mp4 --now
  delulu post "Caption" --to linkedin,twitter --at "2026-07-18T10:00:00Z"
  delulu post "Caption" --to linkedin --draft
  ```

  The CLI journals a stable key automatically. Re-running the identical command
  within 24 hours returns the original result; use `--new` only when the user
  explicitly wants a duplicate.

- Select accounts by ID, platform, username, or `platform@username`. When a
  selector matches several accounts, ask the user to choose the specific one.
- For hosted MCP, call `create_post` once with explicit `draft`, `schedule`, or
  `publish_now` intent. Import remote media first with `import_media`.
- Provide absolute schedule times and confirm the user's timezone when it is not
  already clear.
- Respect returned role behavior. Editors may receive `pending_review`; never
  bypass or misrepresent that state.
- The CLI waits on the original post target by default. If a publish response is
  still `publishing`, poll that post without updating, rescheduling, or creating
  another one. Report partial failures and retry only failed targets.
- Piped CLI responses use TOON. Treat `status`, exit code, and returned target
  states as authoritative. Use `--full` only when truncated content is needed.
