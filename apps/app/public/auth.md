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

After authorization, list workspaces. Use the personal workspace automatically
only when it is the sole workspace; otherwise ask the user to choose. Read setup
status, connect one or more social accounts using the returned provider URLs,
then create a checkout link. Setup completes after a connection exists and the
payment webhook confirms an active paid subscription.

## Content

Upload local files through the CLI or import a public HTTPS URL. Public Google
Drive share links are supported. Create posts with an explicit `draft`,
`schedule`, or `publish_now` intent. Always report the returned post and target
states; organization roles and review requirements remain authoritative.
