import { AuditInput, AuditResult, Recommendation } from "./audit-types";
import { PRICING_REGISTRY } from "@/lib/pricing-registry"; // Ensure this is imported

export class AuditEngine {
  constructor(private input: AuditInput) { }

  public run(): AuditResult {
    const recommendations: Recommendation[] = [];
    let totalCurrentMonthly = 0;
    let totalMonthlySavings = 0;

    this.input.tools.forEach((tool) => {
      const toolMeta = PRICING_REGISTRY[tool.toolId];
      const currentPlan = toolMeta.plans.find(p => p.id === tool.planId);
      totalCurrentMonthly += tool.monthlySpend;

      // Initialize with all required fields from your interface
      let rec: Recommendation = {
        toolId: tool.toolId,
        toolName: toolMeta.name,
        currentPlanName: currentPlan?.name || "Standard",
        currentMonthlyCost: tool.monthlySpend,
        currentSeats: tool.seats,
        recommendationType: "already_optimal",
        recommendedPlanName: currentPlan?.name || "Standard", // Default for optimal
        recommendedMonthlyCost: tool.monthlySpend,          // Default for optimal
        monthlySavings: 0,
        annualSavings: 0,
        reason: "Your current plan is optimal.",
        reasoning: "Based on your team size and use case, your current tier provides the best value."
      };

      // 1. Cursor Logic
      if (tool.toolId === "cursor" && tool.planId === "ultra") {
        const proPlan = toolMeta.plans.find(p => p.id === "pro");
        const proCost = 20 * tool.seats;
        const savings = tool.monthlySpend - proCost;
        rec = {
          ...rec,
          recommendationType: "downgrade_plan",
          recommendedPlanId: "pro",
          recommendedPlanName: "Pro",
          recommendedMonthlyCost: proCost,
          monthlySavings: savings,
          annualSavings: savings * 12,
          reason: "Switch to Cursor Pro.",
          reasoning: "Cursor Pro offers identical core features for professional developers at a lower cost."
        };
      }

      // 2. Claude Logic
      if (tool.toolId === "claude") {
        if (tool.planId === "team" && this.input.teamSize === 1) {
          const savings = tool.monthlySpend - 20;
          rec = {
            ...rec,
            recommendationType: "reduce_seats",
            recommendedPlanId: "pro",
            recommendedPlanName: "Pro",
            recommendedMonthlyCost: 20,
            monthlySavings: savings,
            annualSavings: savings * 12,
            reason: "Downgrade to Pro.",
            reasoning: "Solo users should use Pro instead of Team to avoid the 2-seat minimum cost."
          };
        }
      }

      // Add more logic here as needed...

      recommendations.push(rec);
      totalMonthlySavings += rec.monthlySavings;
    });

    return {
      input: this.input,
      recommendations,
      totalCurrentMonthly,
      totalMonthlySavings,
      totalRecommendedMonthly: totalCurrentMonthly - totalMonthlySavings,
      totalAnnualSavings: totalMonthlySavings * 12,
      savingsCategory: totalMonthlySavings > 300 ? "significant" : "standard"
    };
  }
}