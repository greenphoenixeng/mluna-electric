# Contact form email delivery (Resend)

Both contact forms — the section at the bottom of the homepage (`/#contact`) and the
Contact page (`/contact`) — render `src/components/sections/Contact.astro` and POST JSON to
`/api/contact` (`src/pages/api/contact.ts`), which forwards the lead to the Resend REST API.

## Configuration

| Name | Type | Purpose |
|---|---|---|
| `RESEND_API_KEY` | secret | Resend API key. Without it the endpoint returns 500. |
| `NOTIFY_EMAIL` | plain var | Inbox that receives leads. Defaults to `Info@mlunaelectricinc.com`. |
| `FROM_EMAIL` | plain var | Sender. Must be on a domain verified at resend.com/domains. |

`NOTIFY_EMAIL` and `FROM_EMAIL` are declared in `wrangler.toml` (production under `[vars]`,
preview under `[env.preview.vars]`). The API key is never committed.

## Where the API key lives

Cloudflare Pages project `mluna-electric` → **Settings → Variables and Secrets** → add
`RESEND_API_KEY` as type **Secret**, once for **Production** and once for **Preview**
(the same key is used for both). Equivalent CLI:

```sh
npx wrangler pages secret put RESEND_API_KEY --project-name mluna-electric
npx wrangler pages secret put RESEND_API_KEY --project-name mluna-electric --env preview
```

Secrets are only picked up by deployments created *after* they are set — redeploy afterwards.

## Local development

The Cloudflare adapter exposes a local runtime proxy in `astro dev`, so `locals.runtime.env`
is populated from `wrangler.toml` `[vars]` plus `.dev.vars` — and those win over `.env`. Put
local overrides in `.dev.vars`:

```
NOTIFY_EMAIL=you@example.com
FROM_EMAIL=Acme <onboarding@resend.dev>
RESEND_API_KEY=re_...
```

Both `.env` and `.dev.vars` are gitignored. `onboarding@resend.dev` is Resend's sandbox
sender and can only deliver to the account owner's address.
