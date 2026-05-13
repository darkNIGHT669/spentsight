# TESTS.md

## How to Run

```bash
npm test
```

All tests use Jest with ts-jest. No environment variables required — the audit
engine is pure TypeScript with no external dependencies.

---

## Test Suite: `__tests__/audit-engine.test.ts`

**Run command:** `npm test -- --testPathPattern=audit-engine`

### Test 1 — Solo dev on Cursor Pro is already optimal
**File:** `__tests__/audit-engine.test.ts`
**What it covers:** Verifies the engine does NOT recommend downgrading a solo
developer from Cursor Pro ($20/seat) to Hobby (free). Hobby has limited agent
requests and is not appropriate for professional use. The engine should return
`already_optimal` and zero savings.
**Assertion:** `recommendationType === "already_optimal"` and
`monthlySavings === 0`

---

### Test 2 — Team on Cursor Ultra gets downgrade to Pro
**File:** `__tests__/audit-engine.test.ts`
**What it covers:** A 5-person team on Cursor Ultra ($200/seat = $1,000/mo)
should be recommended to downgrade to Pro ($20/seat = $100/mo) unless they
demonstrably need 20x usage. Validates savings math: $900/mo, $10,800/yr.
**Assertion:** `recommendationType === "downgrade_plan"`,
`recommendedPlanId === "pro"`, `monthlySavings === 900`,
`annualSavings === 10800`

---

### Test 3 — Solo user on Claude Team gets seat reduction to Pro
**File:** `__tests__/audit-engine.test.ts`
**What it covers:** Claude Team requires a minimum of 2 seats at $25/seat. A
solo user on Team is on the wrong plan structurally — Pro at $20/mo is correct.
The engine should detect the seat mismatch and recommend Pro.
**Assertion:** `recommendationType === "reduce_seats"`,
`recommendedPlanId === "pro"`, `monthlySavings > 0`

---

### Test 4 — Claude Pro monthly billing gets annual switch recommendation
**File:** `__tests__/audit-engine.test.ts`
**What it covers:** Claude Pro costs $20/seat/mo monthly but $17/seat/mo
annually. A 3-seat team saves $9/mo ($108/yr) by switching to annual billing
with no change in features. Validates the annual billing rule fires correctly.
**Assertion:** `recommendationType === "switch_to_annual"`,
`monthlySavings === 9`, `annualSavings === 108`

---

### Test 5 — Multi-tool audit aggregates savings correctly
**File:** `__tests__/audit-engine.test.ts`
**What it covers:** End-to-end multi-tool audit. 2 devs on Cursor Ultra
($400/mo) + 2 devs on ChatGPT Plus ($40/mo) = $440/mo total. Cursor Ultra
→ Pro saves $360/mo. Validates that total savings aggregate correctly across
tools and that `savingsCategory` is "significant" (≥$300/mo threshold).
**Assertion:** `totalCurrentMonthly === 440`,
`totalMonthlySavings >= 360`,
`totalAnnualSavings === totalMonthlySavings * 12`,
`savingsCategory === "significant"`

---

### Test 6 — High OpenAI API spend on GPT-5.5 gets model downgrade
**File:** `__tests__/audit-engine.test.ts`
**What it covers:** A team spending $600/mo on GPT-5.5 API ($5/1M input tokens)
should be recommended to switch to GPT-5.4 ($2.50/1M input tokens) — 50%
cheaper for comparable quality on most workloads. Validates API tool evaluation
logic which is separate from per-seat tool logic.
**Assertion:** `recommendationType === "downgrade_plan"`,
`recommendedPlanId === "gpt5_4"`, `monthlySavings > 0`

---

## Coverage

| Area | Covered | Notes |
|---|---|---|
| Seat mismatch detection | ✅ | Test 3 |
| Annual billing switch | ✅ | Test 4 |
| Same-vendor plan downgrade | ✅ | Tests 2, 6 |
| Already-optimal detection | ✅ | Test 1 |
| Multi-tool aggregation | ✅ | Test 5 |
| API tool evaluation | ✅ | Test 6 |
| Alternative tool switch | ❌ | Not yet automated — covered by manual testing |
| API route handlers | ❌ | Integration tests planned for Week 2 |
| Form components | ❌ | E2E tests (Playwright) planned for Week 2 |

## CI

Tests run automatically on every push to `main` via GitHub Actions.
See `.github/workflows/ci.yml`. Latest commit should show a green check.