# METRICS.md

## North Star Metric

**Audits completed per week** — not visitors, not signups.

An audit completed means a user went through all 3 form steps and saw their
results page. This is the moment value is delivered. Everything else (email
capture, Credex consultation, credit purchase) flows downstream from this event.

We don't use "emails captured" as the North Star because it creates an incentive
to move the email gate earlier — which destroys the product's core value
proposition (value before ask). We don't use "visitors" because traffic without
completion is meaningless for a tool product.

---

## 3 Input Metrics That Drive the North Star

**1. Landing page → Step 1 completion rate**
The percentage of visitors who select at least one tool and advance to Step 2.
Target: ≥ 40%. If this drops below 30%, the hero copy or tool grid is failing
to communicate value fast enough.

**2. Step 2 → Step 3 drop-off rate**
The percentage of users who abandon during plan/seat configuration. This is the
highest-friction step — users have to remember their plan details. Target: < 25%
drop-off. If higher, consider adding a "I'm not sure" option that uses median
pricing as a default.

**3. Results page → email capture rate**
Of users who complete an audit, what percentage submit their email. Target: ≥ 20%
overall, ≥ 40% for users with > $300/mo savings identified. If significant-
savings users aren't converting at 40%+, the results page CTA or the Credex
context needs work.

---

## What We'd Instrument First

In priority order:
1. `audit_completed` event with `savings_category` and `total_monthly_savings`
2. `step_abandoned` event with `step_number` (to find drop-off points)
3. `email_captured` event with `audit_id` (to link leads to audit data)
4. `credex_cta_clicked` event (to measure consultation funnel entry)
5. `share_url_copied` event (to measure viral loop activation)

All five can be implemented with a single `analytics.track()` call per event
using Posthog or Plausible (both have free tiers).

---

## Pivot Trigger

**If weekly audit completions are below 50 after 4 weeks of consistent
distribution effort**, the form is too long or the value proposition on the
landing page isn't landing. The pivot would be to reduce the form to a single
step (just monthly spend per tool, no plan selection) and generate a rougher
but faster estimate. Speed of value delivery matters more than precision at
the top of the funnel.

**What scores well here:** Metrics that match a B2B lead-gen tool at this stage.
Audits completed is a leading indicator of pipeline. DAU would be wrong — this
is a tool people use quarterly, not daily.