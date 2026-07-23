INSERT INTO workspace_members (id, workspace_id, user_id, role)
SELECT
  'member_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  workspaces.id,
  workspaces.billing_owner_user_id,
  'owner'
FROM workspaces
WHERE workspaces.is_personal = true
ON CONFLICT (workspace_id, user_id)
DO UPDATE SET role = 'owner', updated_at = now();
