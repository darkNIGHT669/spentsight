/**
 * app/reaudit/[auditId]/page.tsx
 * Shows old vs new audit side by side when pricing has changed.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AuditEngine } from "@/lib/audit-engine";
import { AuditDiffView } from "@/components/AuditDiffView";
import type { AuditInput } from "@/lib/audit-types";

export const metadata: Metadata = {
  title: "Updated Audit — SpendSight",
  description: "See what changed in your AI spend audit since pricing updated.",
};

export default async function ReauditPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;

  const { data: originalAudit, error } = await supabaseAdmin
    .from("audits")
    .select("*")
    .eq("id", auditId)
    .single();

  if (error || !originalAudit) notFound();

  // Re-run with current pricing
  const input: AuditInput = originalAudit.input;
  const newEngine = new AuditEngine(input);
  const newResult = newEngine.run();

  const savingsDelta =
    newResult.totalMonthlySavings - originalAudit.total_monthly_savings;

  return (
    <AuditDiffView
      auditId={auditId}
      originalAudit={{
        recommendations: originalAudit.recommendations,
        totalCurrentMonthly: originalAudit.total_current_monthly,
        totalMonthlySavings: originalAudit.total_monthly_savings,
        totalAnnualSavings: originalAudit.total_annual_savings,
        savingsCategory: originalAudit.savings_category,
        createdAt: originalAudit.created_at,
      }}
      newAudit={{
        recommendations: newResult.recommendations,
        totalCurrentMonthly: newResult.totalCurrentMonthly,
        totalMonthlySavings: newResult.totalMonthlySavings,
        totalAnnualSavings: newResult.totalAnnualSavings,
        savingsCategory: newResult.savingsCategory,
      }}
      savingsDelta={savingsDelta}
    />
  );
}