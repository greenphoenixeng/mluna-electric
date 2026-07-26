# Pending Items — mluna-electric

Last updated: 2026-07-25

## Open branches (not merged to master)

| Branch | Contents | Status |
|---|---|---|
| `devin/1785021497-unit-tests` | Vitest suite — 53 tests across estimator, contact, api-contact | Verified locally: tests pass, build clean, all routes 200. Ready to merge. |
| `devin/1785021332-security-hardening` | Contact API hardening + security headers; fixes duplicated `/contact` heading, real phone/email | Not reviewed or run locally |
| `devin/1785021353-error-handling` | Error handling in contact form / API route / estimator; marks contact API route server-rendered so POST is reachable | Not reviewed or run locally |

Merge order matters — `error-handling` marks the contact API route as server-rendered, which the other two branches touch. Rebase/re-test after each merge.

## Cloudflare adapter warnings (pre-existing, non-blocking)

- `SESSION` KV binding is enabled by the adapter but not declared in the wrangler config. Build will error with "Invalid binding `SESSION`" if sessions are ever actually used — add the binding or disable sessions.
- sharp is not available at Cloudflare runtime. Adapter suggests `imageService: "compile"` so prerendered pages get build-time optimization. Currently unset.

## Launch blockers (carried over from prior sessions — verify before relying on)

- DNS cutover to mlunaelectric.com not done; site is live only on `master.mluna-electric.pages.dev`
- Contact form submission end-to-end delivery not confirmed (no verified email/webhook destination)

## Notes

- Local dev server binds 4322 when 4321 is occupied
- Test commands: `npm test`, `npm run test:watch`, `npm run test:coverage`
