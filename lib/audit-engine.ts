import { AuditInput, AuditResult, Recommendation } from "./audit-types";

export class AuditEngine {
  constructor(private input: AuditInput) { }

  public run(): AuditResult {
    const recommendations: Recommendation[] = [];
    let totalCurrentMonthly = 0;
    let totalMonthlySavings = 0;

    this.input.tools.forEach((tool) => {
      totalCurrentMonthly += tool.monthlySpend;

      let rec: Recommendation = {
        toolId: tool.toolId,
        recommendationType: "already_optimal",
        monthlySavings: 0,
        annualSavings: 0,
        reason: "Your current plan is optimal for your team size and use case.",
        currentMonthlyCost: tool.monthlySpend
      };

      // 1. Cursor Logic
      if (tool.toolId === "cursor") {
        if (tool.planId === "ultra") {
          const proCost = 20 * tool.seats;
          const savings = tool.monthlySpend - proCost;
          rec = {
            toolId: "cursor",
            recommendationType: "downgrade_plan",
            recommendedPlanId: "pro",
            monthlySavings: savings,
            annualSavings: savings * 12,
            reason: "Cursor Pro offers identical core features for professional developers at a fraction of the cost.",
            currentMonthlyCost: tool.monthlySpend
          };
        }
      }

      // 2. Claude Logic
      if (tool.toolId === "claude") {
        if (tool.planId === "team" && this.input.teamSize === 1) {
          const proCost = 20;
          const savings = tool.monthlySpend - proCost;
          rec = {
            toolId: "claude",
            recommendationType: "reduce_seats",
            recommendedPlanId: "pro",
            monthlySavings: savings,
            annualSavings: savings * 12,
            reason: "Solo users should use Pro instead of Team to avoid the 2-seat minimum cost.",
            currentMonthlyCost: tool.monthlySpend
          };
        } else if (tool.planId === "pro" && tool.monthlySpend / tool.seats === 20) {
          const annualMonthlyEquiv = 17;
          const savings = (20 - annualMonthlyEquiv) * tool.seats;
          rec = {
            toolId: "claude",
            recommendationType: "switch_to_annual",
            monthlySavings: savings,
            annualSavings: savings * 12,
            reason: "Switching to annual billing reduces your per-seat cost by 15%.",
            currentMonthlyCost: tool.monthlySpend
          };
        }
      }

      // 3. OpenAI API Logic
      if (tool.toolId === "openai_api" && tool.planId === "gpt5_5") {
        const savings = tool.monthlySpend * 0.5;
        rec = {
          toolId: "openai_api",
          recommendationType: "downgrade_plan",
          recommendedPlanId: "gpt5_4",
          monthlySavings: savings,
          annualSavings: savings * 12,
          reason: "GPT-5.4 provides 95% of the performance for 50% of the cost.",
          currentMonthlyCost: tool.monthlySpend
        };
      }

      recommendations.push(rec);
      totalMonthlySavings += rec.monthlySavings;
    });

    return {
      input: this.input, // Added missing input field
      recommendations,
      totalCurrentMonthly,
      totalMonthlySavings,
      totalRecommendedMonthly: totalCurrentMonthly - totalMonthlySavings, // Added missing field
      totalAnnualSavings: totalMonthlySavings * 12,
      savingsCategory: totalMonthlySavings > 300 ? "significant" : "standard"
    };
  }
}