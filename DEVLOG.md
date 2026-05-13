# DEVLOG.md

## Day 1 — 2025-05-07
**Hours worked:** 3

**What I did:** Initialized the Next.js 14 project with TypeScript, Tailwind,
and shadcn/ui. Visited all 8 vendor pricing pages personally and recorded every
plan name, price, and URL. Built `lib/pricing-registry.ts` — the typed source
of truth for all audit math. Wrote `PRICING_DATA.md` with cited URLs and
verification dates. Set up the project folder structure and GitHub repo.

**What I learned:** ChatGPT now has a "Go" tier at $8/month that sits between
Free and Plus — it didn't exist in my mental model. Gemini's tiers are bundled
with Google One storage which affects how we frame the value comparison. Pricing
pages showed INR on Indian locale — had to cross-reference USD prices separately.

**Blockers / what I'm stuck on:** Committed all Day 1 files in a single large
commit rather than granular ones — a process mistake. Corrected from Day 2
onward with conventional commits per logical unit of work.

**Plan for tomorrow:** Build the AuditEngine class and write the 6 required
tests before touching any UI.

---

## Day 2 — 2025-05-08
**Hours worked:** 4

**What I did:** Built `lib/audit-types.ts` with all shared TypeScript interfaces
(`AuditInput`, `AuditResult`, `ToolRecommendation`). Built `lib/audit-engine.ts`
with 5 prioritized recommendation rules: seat mismatch, annual billing switch,
same-vendor downgrade, alternative tool suggestion, and API consideration for
high-spend accounts. Wrote 6 passing Jest tests. Set up GitHub Actions CI with
lint and test on every push to main.

**What I learned:** Recommendation priority order required deliberate design
decisions. If a user is on a team plan solo AND could switch to annual billing,
which do you surface? I chose seat mismatch first — it's a structural error,
not an optimisation. Annual billing is an enhancement. The order of rules is
the audit logic's "opinion" and needs to be defensible.

**Blockers / what I'm stuck on:** API tools (Anthropic, OpenAI) are usage-based
not per-seat — they need separate evaluation logic. Handled by checking
`tool.category === "api"` and routing to `evaluateApiTool()`.

**Plan for tomorrow:** Multi-step form with Zustand persistence.

---

## Day 3 — 2025-05-09
**Hours worked:** 4

**What I did:** Built the complete 3-step audit form. Zustand store with
`persist` middleware handles localStorage so form state survives page reloads.
Step 1: tool selection grid. Step 2: per-tool plan and seat configuration with
auto-calculated spend from the registry. Step 3: team context and submit.
Built the full design system in `globals.css`: dark financial-grade aesthetic,
DM Mono for numbers, Syne for headings, amber accent for savings values.

**What I learned:** The spend auto-calculation in Step 2 is a significant UX
improvement — it pre-fills the monthly total from the registry so users confirm
rather than recall. Kept the override input because real bills sometimes differ
from list price (annual contracts, grandfathered pricing). Caught a Zustand v4
breaking change: the persist middleware key is `partialize` not `partialState`
— silent failure that only manifested when testing page reload behavior.

**Blockers / what I'm stuck on:** `/api/audit/create` doesn't exist yet so Step
3 submit returns 404. Building that tomorrow.

**Plan for tomorrow:** API routes + results page + Anthropic integration.

---

## Day 4 — 2025-05-10
**Hours worked:** 5

**What I did:** Built `/api/audit/create/route.ts` — receives POST, runs
AuditEngine, calls Anthropic for summary with graceful fallback, writes to
Supabase, returns `auditId`. Built `/api/leads/create/route.ts` — stores email
lead and fires Resend transactional email. Built the results page:
`app/audit/[auditId]/page.tsx` (server component with OG meta) and
`components/AuditResultsClient.tsx` (client component with email modal, share
button, Credex CTA). Hit and resolved the `23502` SQL not-null constraint bug.

**What I learned:** The `23502` error required Vercel server log inspection —
browser DevTools only showed a 500, not the actual cause. The insert payload
was passing `input: undefined` because the AuditEngine result object didn't
include the original input. Added explicit `input: result.input` to the insert.
Also: Anthropic API no longer auto-credits new accounts, so implemented the
deterministic fallback as the primary summary path.

**Blockers / what I'm stuck on:** Next.js 16 treats `params` as a Promise in
server components — `const { auditId } = await params` is required. Claude's
generated code used the old pattern which caused build failures. Fixed manually.

**Plan for tomorrow:** Deploy to Vercel, run Lighthouse, fix scores, user
interviews.

---

## Day 5 — 2025-05-11
**Hours worked:** 3

**What I did:** Deployed to Vercel via the web interface (CLI was incompatible
with local system). Set all 6 environment variables in Vercel dashboard. Ran
Lighthouse on the live URL — Performance 79, Accessibility 95, Best Practices
100, SEO 100. Sent user interview requests to contacts via college coding club
WhatsApp, LinkedIn, and a developer Discord server.

**What I learned:** Performance score of 79 is below the 85 threshold. Primary
cause is render-blocking Google Fonts. Fix: add `font-display: swap` and
preconnect hints. Vercel deployment via web UI is straightforward once env vars
are correctly set — the main gotcha was `NEXT_PUBLIC_BASE_URL` needing the
exact Vercel URL without trailing slash.

**Blockers / what I'm stuck on:** Performance score needs to reach ≥85.
Waiting on interview responses — need 3 confirmed before Day 6.

**Plan for tomorrow:** Fix Lighthouse performance, conduct user interviews,
write USER_INTERVIEWS.md and remaining docs.

---

## Day 6 — 2025-05-12
**Hours worked:** 5

**What I did:** Conducted 3 user interviews — one college contact, one hackathon
connection via LinkedIn, one stranger from a developer Discord. Key findings:
users don't know their own pricing (transparency is standalone value), source
credibility matters more than headline savings number, PDF export is a real CFO
need. Made copy changes based on feedback: added "verified from vendor pages"
under the savings hero, added one-line Credex explainer before CTA. Wrote
GTM.md, ECONOMICS.md, METRICS.md, LANDING_COPY.md, USER_INTERVIEWS.md.

**What I learned:** The most surprising interview finding: an engineering lead
said "this is actually embarrassing" when seeing their breakdown — the emotional
response to lack of visibility is stronger than the financial one. This reframes
the copy opportunity: shame/relief rather than pure savings framing.

**Blockers / what I'm stuck on:** Performance Lighthouse score still at 79 —
fixing first thing tomorrow before final submission.

**Plan for tomorrow:** Fix performance score, write REFLECTION.md, TESTS.md,
README.md, final commit and submit.

---

## Day 7 — 2025-05-13
**Hours worked:** 4

**What I did:** Fixed Lighthouse performance score by adding font preconnect
hints and `font-display: swap`. Wrote REFLECTION.md with specific answers to
all 5 questions. Wrote TESTS.md documenting all 6 audit engine tests. Wrote
README.md with decisions section. Final git history review. Submitted via
Google Form.

**What I learned:** The build process surfaces TypeScript errors that `dev` mode
tolerates — always run `npm run build` locally before pushing to production.
The gap between a working local dev server and a clean production build caught
me twice this week.

**Blockers / what I'm stuck on:** None — submitted.

**Plan for tomorrow:** N/A — Round 1 complete.