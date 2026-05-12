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
  currentPlanName?: string;
  toolName: string;
  recommendedPlanName: string;
  recommendedToolName?: string;
  reason: string;
  reasoning: string;
  currentMonthlyCost: number;
  recommendedMonthlyCost: number;
  currentSeats: number;
  recommendedSeats?: number; // Added this field to match the database table
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