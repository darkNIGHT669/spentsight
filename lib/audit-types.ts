import type { ToolId, UseCase } from "./pricing-registry";

export interface ToolEntry {
  toolId: ToolId;
  planId: string;
  seats: number;
  monthlySpend: number;
}

export interface AuditInput {
  tools: ToolEntry[];
  teamSize: number;
  primaryUseCase: UseCase;
}

export type RecommendationType =
  | "downgrade_plan"
  | "switch_tool"
  | "reduce_seats"
  | "switch_to_annual"
  | "already_optimal"
  | "consider_api";

export interface Recommendation {
  toolId: ToolId;
  recommendationType: RecommendationType;
  recommendedPlanId?: string;
  monthlySavings: number;
  annualSavings: number;
  reason: string;
  // Adding these to ensure the engine and database stay in sync
  currentMonthlyCost?: number;
}

export interface AuditResult {
  auditId?: string;
  input: AuditInput;
  recommendations: Recommendation[];
  totalCurrentMonthly: number;
  totalRecommendedMonthly: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsCategory: "optimal" | "moderate" | "significant" | "standard";
  aiSummary?: string;
  createdAt?: string;
}