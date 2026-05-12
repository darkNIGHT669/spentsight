# ECONOMICS.md — Unit Economics

All numbers are estimates with reasoning shown. Approximate inputs > no inputs.

---

## What Is a Converted Lead Worth to Credex?

Credex sells discounted AI infrastructure credits — Cursor, Claude, ChatGPT
Enterprise, and others — sourced from companies that overforecast or pivoted.

**Revenue model assumption:**
- Average credit purchase: $2,000–$10,000 (a startup buying 6 months of Claude
  Enterprise credits at a discount, for example)
- Credex margin on credits: estimated 15–25% (sourcing arbitrage, not SaaS margin)
- Conservative avg. transaction: $4,000 at 20% margin = **$800 gross profit per sale**
- Repeat purchase rate: 40% within 12 months (once a company trusts the source)
- LTV estimate: $800 × 1.4 repeat factor = **~$1,120 LTV per converted customer**

This is conservative. Enterprise deals (40+ seats, $20k+) would move this
number significantly upward. But for unit economics, we plan around the median.

---

## CAC by Channel

| Channel | Effort | Est. Visitors | Completion Rate | Emails | Consult Rate | Customers | CAC |
|---|---|---|---|---|---|---|---|
| Hacker News Show HN | 2 hrs write + post | 1,000 | 15% | 150 × 25% = 38 | 5% | ~2 | ~$0 |
| r/startups post | 1 hr | 400 | 12% | 48 × 25% = 12 | 5% | ~0.6 | ~$0 |
| LinkedIn (personal) | 30 min | 200 | 15% | 30 × 25% = 7 | 5% | ~0.35 | ~$0 |
| Slack community posts | 2 hrs | 150 | 20% | 30 × 30% = 9 | 8% | ~0.7 | ~$0 |
| Organic search (blog) | 5 hrs/post | 500/mo | 10% | 50 × 20% = 10 | 3% | ~0.3/mo | ~$0 |

**All channels are $0 paid.** CAC = time cost only.

**Time-adjusted CAC:**
If we value engineering/founder time at $50/hr and the initial launch takes
~20 hours total (build + write + post), that's $1,000 in time cost.

Initial launch target: 5 customers.
Time-adjusted CAC: **$200/customer** — well below the $1,120 LTV.
**LTV:CAC ratio: ~5.6:1** — healthy for a B2B lead gen tool at this stage.

---

## Conversion Funnel

```
Landing page visitors
        │
        ▼ 15% complete audit
Audit completed
        │
        ▼ 25% submit email
Email captured (lead)
        │
        ▼ 5% of all leads book call
        (20% of leads showing >$500/mo savings)
Credex consultation booked
        │
        ▼ 30% close
Credit purchase made
```

**Funnel math for 1,000 visitors:**
- 150 audits completed
- 38 emails captured
- ~2 consultations booked (5% of 38)
- ~0.6 credit purchases (30% close rate)
- Revenue: 0.6 × $800 gross profit = **$480 per 1,000 visitors**

**To make this self-sustaining:** At $480 per 1,000 visitors, the tool becomes
profitable vs. paid acquisition if CPM (cost per 1,000 visitors) is under $480.
That's achievable with targeted LinkedIn ads at ~$8 CPM in the eng/founder
demographic — but the $0 organic play should be exhausted first.

---

## What Conversion Rate Makes This Profitable?

**Break-even analysis:**

Fixed costs to run SpendSight:
- Vercel hosting: $0 (free tier handles early traffic)
- Supabase: $0 (free tier: 500MB, 2GB bandwidth)
- Resend email: $0 (3,000 emails/mo free)
- Anthropic API for summaries: ~$0.01 per audit (Sonnet at $3/1M tokens,
  ~3,000 tokens per summary = $0.009)
- Total at 1,000 audits/mo: **~$9/mo in Anthropic costs**

The tool is profitable from the first paying Credex customer.

**Minimum viable conversion to justify maintenance:**
- 1 Credex customer/month = $800 gross profit
- Requires: ~1,667 visitors/mo at the baseline funnel
- That's achievable from consistent Hacker News/Reddit presence alone.

---

## What Has to Be True for $1M ARR in 18 Months

$1M ARR = $83,333/mo in gross profit to Credex from SpendSight-sourced leads.

At $800 gross profit per customer:
→ Need **104 new customers/month** from SpendSight

At 30% close rate on consultations and 5% consult rate on leads:
→ Need **347 consultations/month**
→ Need **6,933 leads/month** (emails captured)
→ Need **27,733 audits/month**
→ Need **184,889 visitors/month**

**Is 185k visitors/month achievable in 18 months?**

With SEO as the primary driver:
- 50 blog posts at 3,000 visitors/mo each = 150,000/mo organic
- Viral sharing of audit result URLs: 20,000/mo (2% of audits shared × avg 7
  viewers per share)
- Direct/referral: 15,000/mo

**This is aggressive but not impossible** with 6+ months of consistent content
and a viral loop built into the product. The more realistic scenario:

| Month | Visitors/mo | Leads/mo | Customers/mo | Cumulative ARR |
|---|---|---|---|---|
| 1–2 | 3,000 | 113 | 1.7 | $16k |
| 3–6 | 15,000 | 563 | 8.4 | $97k |
| 7–12 | 50,000 | 1,875 | 28 | $430k |
| 13–18 | 120,000 | 4,500 | 67 | $1.1M |

**What has to be true:**
1. SEO compounds — each blog post builds domain authority for the next
2. The viral loop works — at least 2% of users share their result URL
3. Credex closes at 30%+ — requires a strong sales motion, not just inbound
4. The $300/mo "significant savings" threshold generates enough high-quality
   leads — if average startup overspend is only $150/mo, the funnel economics
   degrade and the model needs revisiting

**The single biggest risk:** Low average overspend per audit. If users
consistently come in already-optimized (savings < $100/mo), consultation
bookings drop to near zero and the funnel collapses. The tool only works
as a lead gen asset if real overspend exists to surface.

**Mitigation:** The audit engine's "already_optimal" path includes a
"notify me when new savings apply" signup — this captures leads even from
optimized stacks, building a re-engagement list for when pricing changes.

---

## Summary

| Metric | Value |
|---|---|
| Gross profit per customer | ~$800 |
| LTV (with repeat) | ~$1,120 |
| Time-adjusted CAC (launch) | ~$200 |
| LTV:CAC | 5.6:1 |
| Break-even monthly visitors | ~1,667 |
| Cost at 1,000 audits/mo | ~$9 (Anthropic API only) |
| Visitors needed for $1M ARR | ~185,000/mo |
| Timeline to $1M ARR | 16–20 months (content-dependent) |