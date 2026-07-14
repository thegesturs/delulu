---
name: manage-social-publishing
description: Set up and operate Delulu Social through its CLI or hosted MCP tools. Use when a user wants to sign up or authorize an agent, choose a workspace, connect social accounts, complete paid onboarding, upload or import media, create drafts, schedule content, publish posts, or inspect publishing results.
---

# Manage Social Publishing

Use hosted MCP tools when they are already available. Otherwise install and run
the `@delulu/cli` package. Never print, paste into conversation, or manually copy
access or refresh tokens.

## Authorize

1. Call an MCP tool. If the host requests authorization, follow its OAuth flow.
2. For CLI use, run `delulu login`. Surface the verification URL and code, then
   wait for the user to sign up or sign in and approve access.
3. Run `delulu workspaces list` or `list_workspaces`.
4. If exactly one workspace exists, use it. If several exist, ask the user to
   choose and pass its ID explicitly on every operation.

## Complete setup

1. Read `setup status` or call `get_setup_status`.
2. Ask which supported social platforms to connect. For each choice, call
   `accounts connect` or `connect_account`, surface the returned URL, and poll
   setup status until the connection appears or expires.
3. Ask for plan, monthly/yearly interval, and USD/INR currency. Call
   `billing checkout` or `create_checkout` and surface the hosted checkout URL.
4. Poll setup status. Do not claim onboarding is complete until it returns
   `onboardingComplete: true` after both a social connection and confirmed
   payment.

## Prepare and publish content

- Upload local image/video files with `media upload`. For hosted MCP or remote
  media, call `import_media` with a public HTTPS URL. Public Google Drive share
  links are supported; private files are not.
- Use explicit intent: `draft`, `schedule`, or `publish_now`.
- Provide absolute schedule times and confirm the user's timezone when it is not
  already clear.
- Respect returned role behavior. Editors may receive `pending_review`; never
  bypass or misrepresent that state.
- After scheduling or publishing, inspect the returned post and target states.
  Report partial failures and use retry only for failed targets.
