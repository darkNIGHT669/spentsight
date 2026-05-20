# ROUND2_REFLECTION.md

## 1. Most uncomfortable trade-off under time pressure

The most uncomfortable trade-off was skipping automated tests for the new
API routes. In Round 1, I had 6 passing tests for the audit engine — they
were the thing I was most confident about. In Round 2 I shipped four new
routes and a new component with zero automated test coverage.

The specific trade-off: I had roughly 2 hours left after getting the diff
view working end-to-end. I could use those 2 hours to write integration tests
for `/api/detect-changes` (which would require mocking Supabase and Resend),
or I could use them to polish the diff view, write ROUND2_PR.md properly,
and make sure the manual test path worked cleanly for the reviewer.

I chose the latter. The reasoning: the reviewer is going to manually trigger
the flow, not run the test suite first. A polished, working diff view beats
a green CI badge on a feature the reviewer can't easily verify. But it's
uncomfortable because I know the detect-changes route has at least one
concurrency risk I documented but didn't test.

---

## 2. First thing with 24 more hours

Write the integration test for the consolidation logic in
`/api/detect-changes` — specifically the case where one user has multiple
affected audits. The consolidation should send one email, not three. I
tested this manually with a single audit, but I haven't verified the
multi-audit deduplication under realistic conditions.

That's the first thing. Not the unsubscribe page, not the admin dashboard,
not the public pricing changelog — the test that proves the most important
business logic constraint (don't spam users) actually holds.

---

## 3. What Round 1 made harder for Round 2

The `AuditResultsClient.tsx` component had `window.location.origin` at the
top level of the component, outside any event handler or effect. This caused
a `ReferenceError: window is not defined` crash on the server during SSR —
a bug that didn't surface in `npm run dev` (which doesn't fully SSR) but
crashed production on Vercel.

Round 1 me wrote that line without thinking about the server/client boundary.
Round 2 me discovered it when the `/reaudit/[auditId]` page — which is a
server component that imports client components — triggered the same class
of SSR error.

The lesson I should have applied in Round 1: any reference to browser globals
(`window`, `document`, `navigator`) in a component that might render on the
server needs either a `typeof window !== "undefined"` guard or to live inside
`useEffect`. In Round 2 I fixed this properly, but it cost 45 minutes of
debugging time I didn't have.