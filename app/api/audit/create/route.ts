/**
 * app/api/audit/create/route.ts
 *
 * Round 2 update: now saves pricing_snapshot and pricing_version
 * alongside the audit result so stale audits can be detected later.
 */

import { NextRequest, NextResponse } from "next/server";
import { AuditEngine } from "@/lib/audit-engine";
import { supabaseAdmin } from "@/lib/supabase/server";
import { capturePricingSnapshot, snapshotVersion } from "@/lib/pricing-snapshot";
import type { AuditInput } from "@/lib/audit-types";

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (record.count >= RATE_LIMIT) return true;
  record.count++;
  return false;
}

// ─── GEMINI SUMMARY ───────────────────────────────────────────────────────────
async function generateSummary(
  input: AuditInput,
  totalCurrentMonthly: number,
  totalMonthlySavings: number,
  savingsCategory: string
): Promise<string> {
  const toolNames = input.tools
    .map((t) => t.toolId.replace(/_/g, " "))
    .join(", ");

  const prompt = `You are a financial analyst writing a concise audit summary for a startup engineering team.

Context:
- Tools audited: ${toolNames}
- Team size: ${input.teamSize}
- Primary use case: ${input.primaryUseCase}
- Current monthly AI spend: $${totalCurrentMonthly.toFixed(0)}
- Potential monthly savings identified: $${totalMonthlySavings.toFixed(0)}
- Savings category: ${savingsCategory}

Write a single paragraph of exactly 80-100 words. Be specific, use the numbers above, and sound like a CFO-friendly analyst — not a salesperson. If savings are significant (>$300/mo), be direct about the opportunity. If the stack is already optimal, acknowledge it honestly. Never mention Credex. Do not use bullet points. Do not start with "I" or "This audit".`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty Gemini response");
    return text;
  } catch (err) {
    console.error("Gemini API error — using fallback summary:", err);
    return generateFallbackSummary(
      totalCurrentMonthly,
      totalMonthlySavings,
      savingsCategory,
      input.teamSize,
      toolNames
    );
  }
}

function generateFallbackSummary(
  totalCurrentMonthly: number,
  totalMonthlySavings: number,
  savingsCategory: string,
  teamSize: number,
  toolNames: string
): string {
  if (savingsCategory === "optimal") {
    return `Your team of ${teamSize} is spending $${totalCurrentMonthly.toFixed(0)}/month across ${toolNames}. Based on current pricing and your usage profile, your stack appears well-optimised. Monitor your spend as pricing and team size change, and revisit this audit quarterly.`;
  }
  if (savingsCategory === "moderate") {
    return `Your team of ${teamSize} is spending $${totalCurrentMonthly.toFixed(0)}/month on AI tools including ${toolNames}. The audit identified $${totalMonthlySavings.toFixed(0)}/month in potential savings — $${(totalMonthlySavings * 12).toFixed(0)} annually — through plan adjustments and billing optimisations.`;
  }
  return `Your team of ${teamSize} is spending $${totalCurrentMonthly.toFixed(0)}/month on AI tools including ${toolNames}. The audit identified $${totalMonthlySavings.toFixed(0)}/month ($${(totalMonthlySavings * 12).toFixed(0)}/year) in potential savings — a ${Math.round((totalMonthlySavings / totalCurrentMonthly) * 100)}% reduction. Each recommendation is based on verified pricing from vendor pages.`;
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Honeypot
  if (body._hp) {
    return NextResponse.json({ auditId: "fake-id" }, { status: 200 });
  }

  // Rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in an hour." },
      { status: 429 }
    );
  }

  // Validate
  const { tools, teamSize, primaryUseCase } = body as AuditInput;
  if (!tools?.length || !teamSize || !primaryUseCase) {
    return NextResponse.json(
      { error: "Invalid input. Please complete all form steps." },
      { status: 400 }
    );
  }

  // Run audit engine
  const input: AuditInput = { tools, teamSize, primaryUseCase };
  const engine = new AuditEngine(input);
  const result = engine.run();

  // Capture pricing snapshot at this exact moment
  const pricingSnapshot = capturePricingSnapshot();
  const pricingVersion = snapshotVersion(pricingSnapshot);

  // Generate AI summary
  const aiSummary = await generateSummary(
    input,
    result.totalCurrentMonthly,
    result.totalMonthlySavings,
    result.savingsCategory
  );

  // Write to Supabase — now includes pricing snapshot
  const { data, error } = await supabaseAdmin
    .from("audits")
    .insert({
      input: result.input,
      recommendations: result.recommendations,
      total_current_monthly: result.totalCurrentMonthly,
      total_recommended_monthly: result.totalRecommendedMonthly,
      total_monthly_savings: result.totalMonthlySavings,
      total_annual_savings: result.totalAnnualSavings,
      savings_category: result.savingsCategory,
      ai_summary: aiSummary,
      pricing_snapshot: pricingSnapshot,
      pricing_version: pricingVersion,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { error: "Failed to save audit. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ auditId: data.id }, { status: 201 });
}