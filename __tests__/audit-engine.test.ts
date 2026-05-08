/**
 * audit-engine.test.ts
 *
 * Tests for the AuditEngine class.
 * Run with: npm test
 *
 * All tests use realistic inputs that mirror actual user scenarios.
 * Each test validates both the recommendation TYPE and the SAVINGS MATH.
 */

import { AuditEngine } from "../lib/audit-engine";
import type { AuditInput } from "../lib/audit-types";

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Solo developer on Cursor Pro — should stay, already optimal
// Cursor Pro at $20/seat is the right plan for a solo dev doing coding.
// Engine should NOT recommend downgrading to Hobby (free) as a cost-save
// because Hobby has limited agent requests — not fit for professional use.
// ─────────────────────────────────────────────────────────────────────────────
test("Solo dev on Cursor Pro is flagged as already_optimal", () => {
  const input: AuditInput = {
    tools: [{ toolId: "cursor", planId: "pro", seats: 1, monthlySpend: 20 }],
    teamSize: 1,
    primaryUseCase: "coding",
  };

  const result = new AuditEngine(input).run();
  const rec = result.recommendations[0];

  expect(rec.recommendationType).toBe("already_optimal");
  expect(rec.monthlySavings).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: 5-person team on Cursor Ultra — should downgrade to Pro
// Ultra ($200/seat) = $1,000/mo. Pro ($20/seat) = $100/mo.
// Unless they demonstrably need 20x usage, Pro is the right plan.
// Savings: $900/mo, $10,800/yr
// ─────────────────────────────────────────────────────────────────────────────
test("Team on Cursor Ultra gets downgrade_plan recommendation to Pro", () => {
  const input: AuditInput = {
    tools: [{ toolId: "cursor", planId: "ultra", seats: 5, monthlySpend: 1000 }],
    teamSize: 5,
    primaryUseCase: "coding",
  };

  const result = new AuditEngine(input).run();
  const rec = result.recommendations[0];

  expect(rec.recommendationType).toBe("downgrade_plan");
  expect(rec.recommendedPlanId).toBe("pro");
  expect(rec.monthlySavings).toBe(900); // (200-20) * 5
  expect(rec.annualSavings).toBe(10800);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Solo user on Claude Team plan — should reduce_seats to Pro
// Claude Team requires min 2 seats at $25/seat. Solo user should be on
// Pro at $20/mo instead. Savings: $5/mo.
// ─────────────────────────────────────────────────────────────────────────────
test("Solo user on Claude Team gets reduce_seats recommendation to Pro", () => {
  const input: AuditInput = {
    tools: [{ toolId: "claude", planId: "team", seats: 1, monthlySpend: 25 }],
    teamSize: 1,
    primaryUseCase: "writing",
  };

  const result = new AuditEngine(input).run();
  const rec = result.recommendations[0];

  expect(rec.recommendationType).toBe("reduce_seats");
  expect(rec.monthlySavings).toBeGreaterThan(0);
  expect(rec.recommendedPlanId).toBe("pro");
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Claude Pro on monthly billing — should switch to annual
// Pro monthly: $20/seat. Annual equivalent: $17/seat.
// 3-seat team: saves $9/mo, $108/yr.
// ─────────────────────────────────────────────────────────────────────────────
test("Claude Pro monthly billing gets switch_to_annual recommendation", () => {
  const input: AuditInput = {
    tools: [{ toolId: "claude", planId: "pro", seats: 3, monthlySpend: 60 }],
    teamSize: 3,
    primaryUseCase: "writing",
  };

  const result = new AuditEngine(input).run();
  const rec = result.recommendations[0];

  expect(rec.recommendationType).toBe("switch_to_annual");
  expect(rec.monthlySavings).toBe(9); // (20-17) * 3
  expect(rec.annualSavings).toBe(108);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Multi-tool audit — total savings aggregated correctly
// Setup: 2 devs on Cursor Ultra ($400/mo) + 2 devs on ChatGPT Plus ($40/mo)
// Cursor Ultra → Pro saves $360/mo
// ChatGPT Plus → already optimal for coding/writing at $20/seat
// Total expected monthly savings: ≥ $360
// ─────────────────────────────────────────────────────────────────────────────
test("Multi-tool audit aggregates total monthly and annual savings correctly", () => {
  const input: AuditInput = {
    tools: [
      { toolId: "cursor", planId: "ultra", seats: 2, monthlySpend: 400 },
      { toolId: "chatgpt", planId: "plus", seats: 2, monthlySpend: 40 },
    ],
    teamSize: 2,
    primaryUseCase: "coding",
  };

  const result = new AuditEngine(input).run();

  expect(result.totalCurrentMonthly).toBe(440);
  expect(result.totalMonthlySavings).toBeGreaterThanOrEqual(360);
  expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12);
  expect(result.savingsCategory).toBe("significant"); // >$500/mo savings
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: OpenAI API on GPT-5.5 — should recommend downgrade to GPT-5.4
// GPT-5.5 input: $5/1M. GPT-5.4 input: $2.50/1M — 50% cheaper.
// For a team spending $600/mo on GPT-5.5, engine should flag the switch.
// ─────────────────────────────────────────────────────────────────────────────
test("High OpenAI API spend on GPT-5.5 gets downgrade recommendation to GPT-5.4", () => {
  const input: AuditInput = {
    tools: [
      { toolId: "openai_api", planId: "gpt5_5", seats: 1, monthlySpend: 600 },
    ],
    teamSize: 3,
    primaryUseCase: "coding",
  };

  const result = new AuditEngine(input).run();
  const rec = result.recommendations[0];

  expect(rec.recommendationType).toBe("downgrade_plan");
  expect(rec.recommendedPlanId).toBe("gpt5_4");
  expect(rec.monthlySavings).toBeGreaterThan(0);
});