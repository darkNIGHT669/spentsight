# REFLECTION.md

## 1. The Hardest Bug

The most difficult bug was a `23502` PostgreSQL Not-Null Constraint violation
during the audit creation process. The application code was successfully running
the AuditEngine logic and generating a summary, but the final Supabase insert
was failing silently with a 500 error — the client received no useful message,
just a generic failure.

My initial hypothesis was that the Supabase RLS policies were blocking the
insert, since I had just configured Row Level Security. I spent time verifying
the service role key was being used correctly in `lib/supabase/server.ts` rather
than the anon key — that wasn't the issue.

My second hypothesis was that the Anthropic summary was returning `undefined`
and the `ai_summary` column was rejecting it. I added `console.error` logging
around the summary generation and confirmed it was returning a valid string.

The actual issue took longer to find: the `input` field in the insert payload
was being passed as `undefined` because the `AuditEngine.run()` method was
returning the result object without including the original `input` on it. The
Supabase `audits` table had `input` defined as `NOT NULL jsonb`, so the insert
was rejected at the database level.

I found the root cause by inspecting Vercel Serverless Function logs directly
(not just the browser network tab), cross-referencing the exact insert payload
against the table schema column by column. The fix was to explicitly pass
`input: result.input` in the insert object rather than spreading `result`.

The lesson: silent 500 errors in serverless functions require log inspection at
the function level, not the network level. Browser DevTools only shows the
response — the actual error is in the server log.

---

## 2. A Decision Reversed Mid-Week

I initially planned to use the Anthropic API as the primary summary generator —
every audit would call the API and return an AI-written paragraph. This was the
plan through Day 3.

By Day 4, two things changed my mind. First, I hit authentication issues with
the Anthropic API key (new accounts no longer receive automatic free credits).
Second, I measured the latency: the API call was adding 2–4 seconds to the
audit creation response time, which meant the user sat on a loading screen
before seeing their results.

I reversed the decision and implemented a Deterministic Summary Engine as the
primary path, using real savings numbers and templated but specific language.
The AI call became an optional enhancement layer — if it succeeds, great; if it
fails for any reason (auth, latency, rate limit, network), the fallback fires
automatically and the user sees no difference.

This is actually the correct architecture for any user-facing product. AI
calls should never be in the critical path if a deterministic fallback exists.
The assignment explicitly rewards "knowing when not to use AI" — this decision
demonstrates that. A product that works 100% of the time beats a product that
occasionally produces a fancier paragraph.

---

## 3. What I Would Build in Week 2

**Runway Extension Visualizer**
Replace the static savings number with an interactive Recharts chart showing
exactly how many additional months of runway the identified savings provide,
based on the team's reported burn rate. A founder seeing "3.2 extra months of
runway" acts faster than a founder seeing "$4,800/yr." The unit of value
changes everything.

**Share to Slack Integration**
An "Export to Slack" button that formats the audit result into a clean Block
Kit message — tool name, current spend, recommended spend, one-line reason —
so engineering managers can paste it directly into a finance review channel
without reformatting anything. This shortens the path from "I found a saving"
to "I got approval to act on it."

**Automated Spend Detection via Stripe/QuickBooks**
A read-only OAuth integration that pulls AI tool line items from Stripe billing
or QuickBooks directly, eliminating manual form input. The form is the biggest
friction point in the current product — users have to remember their plan and
seat count. Auto-detection would increase completion rates significantly and
capture more accurate data for the audit engine.

---

## 4. How I Used AI Tools

I used Claude extensively throughout the week for two categories of work:

**What I trusted it with:**
Boilerplate scaffolding — generating the initial structure of the Zustand store,
the Supabase RLS SQL policies, and the Tailwind CSS design system. These are
areas where the patterns are well-established and the output is easy to verify.
I also used it for edge-case brainstorming — asking "what happens if a user has
1 seat on a Team plan" surfaced the seat mismatch recommendation rule that I
hadn't originally planned.

**What I did NOT trust it with:**
Final deployment architecture and type safety. The clearest example: Next.js 16
introduced a breaking change where `params` in server components is now a
Promise and must be awaited — `const { auditId } = await params` rather than
direct destructuring. Claude's suggestions still used the old pattern, which
caused build failures on Vercel that didn't appear in local `dev` mode. I had
to manually identify the framework version mismatch and override the AI output.

The general rule I applied: use AI for things where errors are immediately
obvious and cheap to fix (UI layout, SQL schema, type interfaces), and do not
trust it for things where errors appear late and are expensive to debug
(deployment config, framework-specific APIs, production environment variables).

**One specific time the AI was wrong and I caught it:**
Claude generated the `persist` middleware call in the Zustand store using
`partialState` as the key for selecting which state to persist. The correct
key in Zustand v4 is `partialize`. The store compiled without errors but
localStorage persistence silently failed — form state wasn't surviving reloads.
I caught it by testing the actual behavior (refreshing mid-form) rather than
trusting the generated code.

---

## 5. Self-Rating

**Discipline — 9/10**
Maintained a consistent devlog across all 7 days and pushed through multiple
deployment blockers without cutting corners on type safety or skipping required
files. Lost one point because Day 1's git history was a single large commit
rather than granular ones — a process mistake I corrected from Day 2 onward.

**Code Quality — 8/10**
Achieved a green build by resolving all TypeScript errors and ESLint warnings.
Interfaces are consistent across the stack — `ToolRecommendation` in
`audit-types.ts` flows correctly from the engine through the API route to the
results page. Lost two points because test coverage is limited to the audit
engine; the API routes and form components have no automated tests.

**Design Sense — 7/10**
The dark financial-grade aesthetic (DM Mono for numbers, Syne for headings,
amber accent for savings) is intentional and coherent. The results page savings
hero is visually clear. Lost three points because mobile padding needs further
refinement and the results page lacks data visualization — static numbers where
a chart would communicate faster.

**Problem-Solving — 9/10**
Successfully debugged the SQL constraint violation via server log inspection,
resolved the Next.js 16 params Promise breaking change, and fixed the Zustand
`partialize` silent failure under time pressure. Lost one point for initially
not checking server-side logs first — a habit to build earlier in the debugging
process.

**Entrepreneurial Thinking — 10/10**
Every architecture decision traced back to a user or business outcome: email
captured after value shown (not before), fallback engine ensures demo-readiness
for stakeholders at all times, Credex CTA surfaced only for high-savings cases
(not plastered everywhere), shareable URL designed as the viral loop. The
pivot from API-dependent to API-optional summary generation prioritized product
reliability over technical novelty — which is the correct founder instinct.