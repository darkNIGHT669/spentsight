/**
 * app/audit/[auditId]/page.tsx
 * The results page. This is the page that gets screenshotted and shared.
 * Design priority: savings number must be impossible to miss.
 */

import { notFound } from "next/navigation";
//import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AuditResultsClient } from "@/components/AuditResultsClient";
import type { Recommendation } from "@/lib/audit-types";

interface AuditRow {
  id: string;
  total_current_monthly: number;
  total_recommended_monthly: number;
  total_monthly_savings: number;
  total_annual_savings: number;
  savings_category: string;
  ai_summary: string;
  recommendations: Recommendation[];
  created_at: string;
}

async function getAudit(auditId: string): Promise<AuditRow | null> {
  const { data, error } = await supabaseAdmin
    .from("audits")
    .select(
      "id, total_current_monthly, total_recommended_monthly, total_monthly_savings, total_annual_savings, savings_category, ai_summary, recommendations, created_at"
    )
    .eq("id", auditId)
    .single();

  if (error || !data) return null;
  return data as AuditRow;
}

// ─── OPEN GRAPH META ─────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params; // Unwrapping the promise
  const audit = await getAudit(auditId);
  if (!audit) return { title: "Audit not found — SpendSight" };

  const annualSavings = Math.round(audit.total_annual_savings);
  const isOptimal = audit.savings_category === "optimal";

  const title = isOptimal
    ? "AI spend audit — stack is optimised · SpendSight"
    : `AI spend audit — $${annualSavings.toLocaleString()}/yr in savings found · SpendSight`;

  const description = isOptimal
    ? "This team's AI tool stack is already well-optimised. See the full breakdown."
    : `This team could save $${annualSavings.toLocaleString()}/year on AI tools. See the full audit.`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://spentsight.com";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/audit/${audit.id}`,
      siteName: "SpendSight",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default async function AuditPage({ params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params; // Unwrapping the promise
  const audit = await getAudit(auditId);
  if (!audit) notFound();

  return (
    <AuditResultsClient
      auditId={audit.id}
      totalCurrentMonthly={audit.total_current_monthly}
      totalRecommendedMonthly={audit.total_recommended_monthly}
      totalMonthlySavings={audit.total_monthly_savings}
      totalAnnualSavings={audit.total_annual_savings}
      savingsCategory={audit.savings_category as "optimal" | "moderate" | "significant"}
      aiSummary={audit.ai_summary}
      recommendations={audit.recommendations}
      createdAt={audit.created_at}
    />
  );
}