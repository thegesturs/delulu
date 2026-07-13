# M5 rehearsal evidence gap

The latest local rehearsal outputs were captured on 2026-07-12, but they do
**not** form a coherent sign-off. The manifest was written at 14:42:34 IST;
the three human-review reports were written at 01:55:13 IST and contain data
that does not match the manifest. Their hashes are retained for traceability,
not as evidence of a green-twice rehearsal.

## Recorded outputs

| Artifact | SHA-256 |
|---|---|
| `migration_run.json` | `ea618e5dc8cee829b83aa2fed2e7a74d85f125848fe323b5337f1d2fc4221e26` |
| `ownership-audit.md` | `a7b05ada908c7ab03894e4c4f2d64f2b7385a7e5fbdd92ef2c6300e98fe1f091` |
| `role-mapping-report.md` | `483b6528d1315cea1d49c6f955d3a272504d012d25f9317f62134a6d0515674d` |
| `edge-case-counters.md` | `37843722253c0aeb759c115fc95a6cc2afec84ea32dde09ba1f3d29707efc50b` |

The manifest recorded 6 users, 7 workspaces, 8 workspace members, 3
connections, 49 media rows, 82 posts, 16 post targets, 6 subscriptions, 2 post
reviews, 3 review-activity rows, 3 automations, and 14 transcriptions. It also
recorded 6 reconciled subscriptions, 0 expired reservations, and 0 trigger-index
rows.

The manifest contains transform warnings and edge-case counters,
including dropped deleted-organization posts and pruned targets whose providers
were not migrated. M5 rehearsal sign-off therefore remains an operator gate:
the production export must regenerate all four artifacts from the same
snapshot/run, pass verification twice, and receive explicit human
ownership/role/edge-case sign-off before routing.
