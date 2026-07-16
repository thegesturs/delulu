# Delulu Social agent authorization

Use the authorization server advertised by the API protected-resource metadata.

## Sign in

1. POST `client_id`, `scope`, and `resource` to the advertised
   `device_authorization_endpoint`.
2. Show the user `verification_uri_complete` and `user_code`.
3. Poll `token_endpoint` no faster than `interval` using grant type
   `urn:ietf:params:oauth:grant-type:device_code` and the returned `device_code`.
4. Store access and refresh tokens only in the platform credential store. Never
   print them or include them in conversation.
5. Refresh through the advertised token endpoint and revoke credentials when the
   user logs out.

## Setup

Run `delulu` after authorization. Its workspace overview returns the current
workspace, setup state, connection and subscription summary, publishing counts,
and the highest-priority next command in one response. Use `delulu workspace`
to list memberships and `delulu workspace use <selector>` to reauthorize for a
different workspace. Connect accounts with `delulu connect <platform>` and
start checkout with `delulu subscribe`. Setup completes only after a connection
exists and the payment webhook confirms an active paid subscription.

## Content

Use `delulu post "Caption" --to <account> --media <path-or-url> --now` for the
complete publish-now flow. Omit the intent or use `--draft` to create a draft;
use `--at` with an absolute ISO 8601 timestamp to schedule. Content can also
come from `--file` or stdin. The command generates a stable local operation key,
uploads or imports media, atomically creates the post, and waits on the original
target. Hosted MCP clients call `create_post` once with the same explicit
intent. Always report returned states; workspace roles and reviews remain
authoritative.

CLI output is compact for terminals and TOON when piped. Use `--json` for JSON,
or `--full` to disable content truncation. Treat nonzero exit codes and
structured `status: error` results as failures; never infer success from a URL
or a nonterminal publishing state.
