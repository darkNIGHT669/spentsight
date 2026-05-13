# SpendSight — AI Spend Audit for Dev Teams

SpendSight is a free web app that audits a startup's AI tool spend across
Cursor, GitHub Copilot, Claude, ChatGPT, OpenAI API, Anthropic API, Gemini,
and Windsurf — and surfaces exactly where they're overpaying, with defensible
finance-grade reasoning. Built as a lead-generation asset for Credex.

**Live URL:** https://spentsight.vercel.app

---

## Screenshots

> Add 3 screenshots here before submitting:
> 1. Landing page with the form (Step 1 tool selection)
> 2. Results page showing savings hero and per-tool breakdown
> 3. Results page showing the Credex CTA (use a high-savings scenario)
>
> Or replace with a Loom link: https://loom.com/share/YOUR_LINK

---

## Quick Start

### Run locally

```bash
git clone https://github.com/YOUR_USERNAME/spentsight.git
cd spentsight
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key_or_dummy
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

```bash
npm run dev
```

Open http://localhost:3000

### Run tests

```bash
npm test
```

### Deploy

Push to `main` — Vercel auto-deploys via GitHub integration.

---

## Decisions

**1. Audit engine uses zero AI for the math**
The AuditEngine class is pure TypeScript with hardcoded pricing data from
verified vendor pages. Every recommendation traces to a specific pricing fact.
This is intentional — an LLM hallucinating a price would undermine the entire
trust model of the product. AI is used only for the ~100-word summary paragraph,
with a deterministic fallback so the product works without any API key.

**2. Zustand with `persist` middleware for form state**
The assignment required form state to survive page reloads. Zustand's `persist`
middleware writes to localStorage in one line of config. Considered React Query
but it's optimized for server state, not local form state. Considered URL params
but that would expose plan/seat data in the address bar unnecessarily.

**3. Results page before email gate**
Email is captured after the audit result is shown, never before. This is a
deliberate product decision — the value must be demonstrated before the ask.
Testing showed users abandon immediately when asked for email before seeing
results. The email gate converts better when users have already seen their
savings number.

**4. Separate Supabase client and admin client**
`lib/supabase/client.ts` uses the anon key (browser-safe, respects RLS).
`lib/supabase/server.ts` uses the service role key (server-only, bypasses RLS
for writes). Mixing these would either expose the service role key to the client
or prevent server-side writes from working. Keeping them separate is the correct
Supabase architecture for Next.js App Router.

**5. In-memory rate limiting over Redis**
Used a simple in-memory Map for rate limiting instead of Upstash Redis. Trade-
off: in-memory state resets on serverless cold starts, so the limit is per-
instance rather than global. Acceptable for an MVP — Redis would be the right
call at production scale. Documented in DEVLOG Day 4.