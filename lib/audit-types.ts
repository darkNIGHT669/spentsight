import type { ToolId, UseCase } from "./pricing-registry";

// lib/audit-types.ts
interface ToolEntry {
  toolId: ToolId;
  planId: string;
  seats: number;
  monthlySpend: number;
}

interface AuditInput {
  tools: ToolEntry[];
  teamSize: number;
  primaryUseCase: UseCase;
}

// Explicitly export at the bottom

export type RecommendationType =
  | "downgrade_plan"
  | "switch_tool"
  | "reduce_seats"
  | "switch_to_annual"
  | "already_optimal"
  | "consider_api";

export interface ToolRecommendation {
  toolId: ToolId;
  toolName: string;
  currentPlanName: string;
  currentMonthlyCost: number;
  recommendationType: RecommendationType;
  recommendedPlanId?: string;
  recommendedPlanName?: string;
  recommendedToolId?: ToolId;
  recommendedToolName?: string;
  recommendedMonthlyCost: number;
  monthlySavings: number;
  annualSavings: number;
  reasoning: string;
}

export interface AuditResult {
  auditId?: string;
  input: AuditInput;
  recommendations: ToolRecommendation[];
  totalCurrentMonthly: number;
  totalRecommendedMonthly: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsCategory: "optimal" | "moderate" | "significant";
  aiSummary?: string;
  createdAt?: string;
}
export type { ToolEntry, AuditInput };