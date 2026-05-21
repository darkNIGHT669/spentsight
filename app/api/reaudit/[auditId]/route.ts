/**
 * app/api/reaudit/[auditId]/route.ts
 *
 * Fetches the original audit, re-runs the engine with current pricing,
 * and returns both results so the diff view can compare them.
 */

import { NextRequest, NextResponse } from "next/server";
import { AuditEngine } from "@/lib/audit-engine";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AuditInput } from "@/lib/audit-types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;

  // Fetch original audit
  const { data: originalAudit, error } = await supabaseAdmin
    .from("audits")
    .select("*")
    .eq("id", auditId)
    .single();

  if (error || !originalAudit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  // Re-run audit engine with current pricing
  const input: AuditInput = originalAudit.input;
  const newEngine = new AuditEngine(input);
  const newResult = newEngine.run();

  return NextResponse.json({
    auditId,
    originalAudit: {
      recommendations: originalAudit.recommendations,
      totalCurrentMonthly: originalAudit.total_current_monthly,
      totalMonthlySavings: originalAudit.total_monthly_savings,
      totalAnnualSavings: originalAudit.total_annual_savings,
      savingsCategory: originalAudit.savings_category,
      createdAt: originalAudit.created_at,
    },
    newAudit: {
      recommendations: newResult.recommendations,
      totalCurrentMonthly: newResult.totalCurrentMonthly,
      totalMonthlySavings: newResult.totalMonthlySavings,
      totalAnnualSavings: newResult.totalAnnualSavings,
      savingsCategory: newResult.savingsCategory,
    },
    savingsDelta: newResult.totalMonthlySavings - originalAudit.total_monthly_savings,
  });
}