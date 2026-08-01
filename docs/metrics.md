# Dashboard metric definitions

Source: `lib/db/metrics.ts` (`getDashboardMetrics`). All computed live
from `conversations`/`contacts`/`organization_members`/`profiles` —
nothing is precomputed or cached (`daily_metrics` table exists in the
schema for a future rollup job but isn't written to yet).

Day boundaries are **UTC**, not the organization's local timezone —
a deliberate MVP simplification, not yet using `organizations.timezone`.

| Metric | Formula |
|---|---|
| Open conversations | `count(conversations.status = 'open')` |
| Pending conversations | `count(conversations.status = 'pending')` |
| Resolved today | `count(status = 'resolved' AND resolved_at >= today 00:00 UTC)` |
| Avg first response | `avg(first_response_at - created_at)` over conversations that have a `first_response_at`, in seconds. `null` if none do. |
| Queue by priority | Count of open+pending conversations grouped by `priority`. |
| Response time by day (7d) | Same avg-first-response formula, bucketed by the UTC day `first_response_at` falls in. `null` for days with no first response. |
| Channel mix | Count of conversations grouped by their contact's `primary_channel`. |
| Team performance | Per member: `handled` = resolved conversations assigned to them; `avgResolutionSeconds` = `avg(resolved_at - created_at)` over those. |

## Deliberately not shown (would require faking data)

- **CSAT** — no post-conversation survey feature exists yet.
- **Intent breakdown / AI deflection rate** — no AI reply generation yet (Faz 5); nothing populates `detected_intent` or `ai_reply_drafts`.
- **SLA % within target** — no `sla_policies` row exists for any org yet (no UI to create one); showing a percentage against a policy that isn't configured would be misleading.

These will be added when their underlying data actually exists, not before.
