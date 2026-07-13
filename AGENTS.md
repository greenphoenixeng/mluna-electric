# M Luna Electric — Project Context
**Client:** M Luna Electric
**Site:** mlunaelectric.com
**Type:** Brochure / marketing website
**GPE Base:** Software Projects (appjwZjJvEwuGM2Lt)

---

## Project Overview

Simple marketing website for M Luna Electric, an electrical contractor. No backend, no auth,
no database. Pure static site with optional form-based lead capture.

---

## Milestones

| # | Scope | Deliverable |
|---|-------|------------|
| 1 | Site architecture, design system, Homepage, Services page | Homepage live on staging |
| 2 | About page, Gallery, Estimator widget, SEO implementation | Full site on staging for client review |
| 3 | Client review + revisions, DNS cutover, QA, launch | Site live at mlunaelectric.com |

---

## Pages

| Page | Route | Status |
|------|-------|--------|
| Homepage | `/` | M1 |
| Services | `/services` | M1 |
| About | `/about` | M2 |
| Gallery | `/gallery` | M2 |
| Estimator | `/estimator` | M2 |
| Contact | `/contact` | M1 (form) |

---

## Tech Stack

- **Framework:** Astro (static site generator)
- **Styling:** Tailwind CSS
- **Platform:** Cloudflare Pages (free tier)
- **Forms:** Cloudflare Worker (lead capture → email via Resend or n8n webhook)
- **Images:** Static assets in `src/assets/` (optimize at build time via Astro)
- **Analytics:** Cloudflare Web Analytics (free, privacy-first)
- **CI/CD:** GitHub Actions → Cloudflare Pages auto-deploy

## Repository

- **GitHub Org:** greenphoenixeng
- **Repo:** https://github.com/greenphoenixeng/mluna-electric
- **Branch strategy:**
  - `main` → production (mlunaelectric.com)
  - `staging` → staging (mluna-electric-staging.pages.dev)
  - `feature/*` → preview (ephemeral CF Pages preview URLs)

---

## Design Direction

Electrical contractor — professional, trustworthy, modern. Color palette TBD with client.
Suggested: dark navy or charcoal primary, electric yellow/amber accent.

---

## Estimator Widget

Interactive frontend calculator only (no backend). Client enters:
- Job type (residential / commercial / service call)
- Square footage or job description
- Outputs a rough estimate range

If lead capture is needed, form submission POSTs to a Cloudflare Worker that forwards to
client email via Resend (or n8n webhook if already provisioned).

---

## SEO Implementation (M2)

- Astro's built-in `<head>` meta management
- `sitemap.xml` via `@astrojs/sitemap`
- Open Graph + Twitter card meta
- Schema.org LocalBusiness JSON-LD
- `robots.txt`
- Google Search Console verification

---

## Skills to Use

| Phase | Skill |
|-------|-------|
| Planning | `/swe-planner` |
| Implementation | `/swe-implementer` |
| QA | `/swe-qa` |
| Status / EOD | `/swe-reporter` |

---

## Architecture Decision

See: `docs/decisions/001-platform-selection.md`
