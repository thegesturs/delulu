# Email lifecycle operations

## Required production configuration

1. In Cloudflare Email Service, onboard `notify.delulu.social`, apply the
   generated SPF/DKIM/DMARC records, and bind `EMAIL` to the API Worker.
2. Set `CLOUDFLARE_EMAIL_FROM=notify@delulu.social` and the `LOOPS_API_KEY`
   Worker secret. Do not set either value in source control.
3. In Loops, configure `updates.delulu.social` as the sending domain and create
   event-triggered workflows from the events listed below. Product code never
   uses Loops-specific names outside the messaging provider adapter.
4. Route replies from both domains to the support inbox. Add a one-click
   unsubscribe link to every Loops email and map it to
   `product_lifecycle_enabled=false` in the preference center.

## Calendar webhook configuration

Create one dedicated 15-minute event with slug `swaraj/retention`, then create
one enabled webhook using API version `2021-10-20`:

- Subscriber URL: `https://api.delulu.social/webhooks/cal`
- Triggers: Booking created, Booking rescheduled, and Booking canceled only
- Custom payload template: disabled
- Secret: a new random value stored as the Worker secret
  `CAL_WEBHOOK_SECRET`

Remove every other trigger from the webhook. Set
`CAL_RETENTION_EVENT_SLUG=retention`, deploy the Worker, and run the calendar
provider's ping test. The handler verifies `x-cal-signature-256` against the raw
request body and accepts only the opaque `cancellationReference` embed metadata;
attendee name and email are never used to locate an account.

## Billing webhook configuration

Keep the existing `https://api.delulu.social/webhooks/dodo` webhook and enable
these event types:

- `payment.succeeded`, `payment.failed`
- `subscription.active`, `subscription.updated`, `subscription.renewed`
- `subscription.on_hold`, `subscription.plan_changed`
- `subscription.cancelled`, `subscription.failed`, `subscription.expired`

The production API key must be permitted to update subscriptions, create
customer-wallet ledger credits, create checkout sessions, and open the customer
portal. Provider delivery retries are safe because webhook events, wallet
credits, cancellation transitions, and queued messages are idempotent.

All new purchases and recovery purchases must start from the authenticated
in-app checkout endpoint. It writes `billing_owner_user_id` into opaque provider
metadata, so webhook ownership does not depend on the address or name entered at
checkout. Later recurring events fall back only to the already-linked provider
customer ID. The webhook intentionally does not guess by customer name or email.

Clerk remains the sole sender for authentication, account-security, workspace
invitation, and workspace-role emails. Do not duplicate those notices through
Cloudflare Email Service or Loops. This lifecycle system owns only billing,
product-critical, and opted-in product-lifecycle communication.

## Loops events and workflows

| Event | Workflow | Delay / exit condition |
| --- | --- | --- |
| `subscription.active` with active paid status | Paid welcome | Send immediately; exit once a social account is connected |
| `onboarding_incomplete` | Onboarding rescue | 24h, 3d, 7d; exit on completion |
| `instagram_connected` | Automation education | 3d and 7d if no Instagram automation exists; never enter this journey for another platform alone |
| `post_scheduled` / `post_published` / `automation_created` | First-value celebration | Send once per milestone |
| `user_inactive` | At-risk reactivation | 7d, 14d, 30d; exit on activity or cancellation |
| `payment_failed` | Payment recovery | Exit on payment recovery or cancellation |
| `cancellation_scheduled` | Cancellation recovery | At cancellation, then 7d and 30d after end date |

Apply a global frequency cap of two lifecycle messages per rolling seven days
and a 24-hour quiet period after billing or security email. Suppress lifecycle
messages when product lifecycle preference is disabled, a cancellation is
pending, or the account has been deleted.

## Cancellation copy and operations

The product cancellation flow must state: publishing and automations end at the
current term end; data remains recoverable for 60 days; permanent deletion then
follows, subject to legal retention. It must collect a cancellation reason and
comment, offer `https://cal.com/swaraj/retention`, and only auto-offer the one free cycle
to monthly customers paid for at least 30 days who have never redeemed it.
Annual credits are approved manually during the retention call.

Run the 30-day and 7-day recovery notices before the deletion deadline. The
deletion worker must revoke access and connection tokens before removing user
data, then send a transactional completion notice.
