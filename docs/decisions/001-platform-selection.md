# Architecture Decision — M Luna Electric
**Date:** 2026-07-13
**Decided by:** GPE Architect (Claude)

---

## Platform: Cloudflare Pages + Astro
**Rationale:** This is a pure static brochure site with no auth, no database, and no long-running
processes. Cloudflare Pages is the canonical GPE default for static marketing sites — it's free,
globally distributed via CDN, deploys in seconds, and provides ephemeral preview URLs per PR.
Astro is chosen as the framework for its zero-JS-by-default output, built-in image optimization,
and excellent SEO primitives (sitemap, meta management). This combination gives the client a
fast, maintainable site with essentially $0/mo infrastructure cost.

## Database: None
**Rationale:** Brochure site. No persistent data.

## Auth: None
**Rationale:** Public-facing only. No login flows.

## Storage: Static assets in repo
**Rationale:** Gallery images expected to be modest in count. Committed to `src/assets/gallery/`
and optimized at build time by Astro. If client needs to manage photos without a code deploy,
revisit Cloudflare R2 + a simple CMS (Decap CMS or Keystatic) in M3.

## Forms / Lead Capture: Cloudflare Worker
**Rationale:** Contact form and estimator lead capture POST to a lightweight CF Worker that
forwards to client email via Resend API. No database, no vendor lock-in, ~$0 cost.

## CI/CD: GitHub Actions → Cloudflare Pages
**Branch strategy:**
  - `main` → production (mlunaelectric.com after DNS cutover in M3)
  - `staging` → staging (mluna-electric-staging.pages.dev)
  - `feature/*` → preview deployments (ephemeral, per-PR)

## Environments:
  - Production: https://mlunaelectric.com
  - Staging: https://mluna-electric-staging.pages.dev
  - Preview: https://[branch-hash].mluna-electric.pages.dev

## Estimated Monthly Cost:
  - Cloudflare Pages: $0/mo (free tier — 500 builds/mo, unlimited bandwidth)
  - Cloudflare Workers (form handler): $0/mo (100k requests/day free)
  - Cloudflare Web Analytics: $0/mo
  - Resend (email): $0/mo (3k emails/mo free)
  - **Total: ~$0/mo**

## Rejected Alternatives:
  - Vercel: No benefit over CF Pages for a static site; adds cost without capability gain
  - AWS: Massively over-engineered for a 5-page brochure site
  - WordPress/Webflow: Adds CMS complexity client doesn't need; harder to maintain long-term
