/**
 * audit-engine.ts
 *
 * Deterministic, hardcoded recommendation logic.
 * NO AI is used here — every recommendation traces to a pricing fact.
 * This is intentional: knowing when NOT to use AI is part of the design.
 *
 * Recommendation priority order (per tool):
 *  1. Seat count mismatch  → reduce_seats
 *  2. Annual billing available → switch_to_annual
 *  3. Cheaper plan fits use case → downgrade_plan
 *  4. Cheaper alternative tool → switch_tool
 *  5. Heavy spend → consider_api (for chat tools)
 *  6. Nothing found → already_optimal
 */

import {
    PRICING_REGISTRY,
    getMonthlyCost,
    getPlan,
    type ToolId,
    type UseCase,
  } from "./pricing-registry";
  
  import type {
    AuditInput,
    AuditResult,
    RecommendationType,
    ToolEntry,
    ToolRecommendation,
  } from "./audit-types";
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CONSTANTS — thresholds that drive recommendations
  // ─────────────────────────────────────────────────────────────────────────────
  
  /** If monthly API spend exceeds this, flag for audit */
  const API_SPEND_REVIEW_THRESHOLD = 500;
  
  /** Monthly savings floor — below this, not worth surfacing as a recommendation */
  const MIN_SAVINGS_TO_RECOMMEND = 5;
  
  /** Credex CTA threshold — show consultation prompt above this */
  const CREDEX_CTA_THRESHOLD = 500;
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ALTERNATIVE TOOL MAP
  // Which tools are genuine substitutes for each other, by use case.
  // The reasoning must be defensible — not "X is better", but "X costs less
  // for the same category of work at your usage level."
  // ─────────────────────────────────────────────────────────────────────────────
  
  interface AlternativeSuggestion {
    toolId: ToolId;
    planId: string;
    reasoning: string;
  }
  
  const ALTERNATIVES: Partial<
    Record<ToolId, Partial<Record<UseCase | "default", AlternativeSuggestion>>>
  > = {
    cursor: {
      coding: {
        toolId: "github_copilot",
        planId: "pro",
        reasoning:
          "GitHub Copilot Pro ($10/seat) covers inline completions and chat for most coding workflows — at half the cost of Cursor Pro. Switch if you're not using Cursor's Agent or MCP features regularly.",
      },
      default: {
        toolId: "github_copilot",
        planId: "pro",
        reasoning:
          "GitHub Copilot Pro ($10/seat) is a direct alternative for AI-assisted coding at 50% of Cursor Pro's price.",
      },
    },
    github_copilot: {
      coding: {
        toolId: "cursor",
        planId: "pro",
        reasoning:
          "Cursor Pro ($20/seat) includes agentic coding, MCP integrations, and multi-file context that justifies the 2× price if your team does complex refactoring or autonomous coding tasks.",
      },
    },
    chatgpt: {
      writing: {
        toolId: "claude",
        planId: "pro",
        reasoning:
          "Claude Pro ($20/seat) matches ChatGPT Plus on writing quality and is priced identically — worth evaluating if your team prefers Claude's tone or uses Projects for context management.",
      },
      coding: {
        toolId: "cursor",
        planId: "pro",
        reasoning:
          "For coding-primary teams, Cursor Pro ($20/seat) provides a dedicated IDE integration vs ChatGPT's chat interface — same price, purpose-built for code.",
      },
      default: {
        toolId: "claude",
        planId: "pro",
        reasoning:
          "Claude Pro ($20/seat) is a like-for-like alternative to ChatGPT Plus at the same price point with comparable capability.",
      },
    },
    claude: {
      coding: {
        toolId: "cursor",
        planId: "pro",
        reasoning:
          "For coding-primary use cases, Cursor Pro ($20/seat) provides IDE-native context and agent capabilities that Claude's chat interface cannot replicate.",
      },
      default: {
        toolId: "chatgpt",
        planId: "plus",
        reasoning:
          "ChatGPT Plus ($20/seat) is a like-for-like alternative at the same price — worth testing if your team needs GPT-5.5 specifically.",
      },
    },
    windsurf: {
      coding: {
        toolId: "github_copilot",
        planId: "pro",
        reasoning:
          "GitHub Copilot Pro ($10/seat) covers the same inline completion and chat use cases at half the price of Windsurf Pro. Switch if you're not using Windsurf's Devin Cloud or agentic sessions.",
      },
      default: {
        toolId: "cursor",
        planId: "pro",
        reasoning:
          "Cursor Pro ($20/seat) matches Windsurf Pro in price with a larger ecosystem and more integrations. Worth evaluating if you're already on the $20 tier.",
      },
    },
  };
  
  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT ENGINE
  // ─────────────────────────────────────────────────────────────────────────────
  
  export class AuditEngine {
    private input: AuditInput;
  
    constructor(input: AuditInput) {
      this.input = input;
    }
  
    run(): AuditResult {
      const recommendations: ToolRecommendation[] = this.input.tools.map(
        (entry) => this.evaluateTool(entry)
      );
  
      const totalCurrentMonthly = recommendations.reduce(
        (sum, r) => sum + r.currentMonthlyCost,
        0
      );
      const totalRecommendedMonthly = recommendations.reduce(
        (sum, r) => sum + r.recommendedMonthlyCost,
        0
      );
      const totalMonthlySavings = totalCurrentMonthly - totalRecommendedMonthly;
      const totalAnnualSavings = totalMonthlySavings * 12;
  
      return {
        input: this.input,
        recommendations,
        totalCurrentMonthly,
        totalRecommendedMonthly,
        totalMonthlySavings,
        totalAnnualSavings,
        savingsCategory: this.categorizeSavings(totalMonthlySavings),
      };
    }
  
    // ── PER-TOOL EVALUATION ────────────────────────────────────────────────────
  
    private evaluateTool(entry: ToolEntry): ToolRecommendation {
      const tool = PRICING_REGISTRY[entry.toolId];
      const currentPlan = getPlan(entry.toolId, entry.planId);
  
      // Fallback if plan not found in registry
      if (!currentPlan || !tool) {
        return this.buildOptimalResult(entry, entry.monthlySpend, "Tool or plan not found in registry — verify manually.");
      }
  
      const currentMonthlyCost = getMonthlyCost(
        entry.toolId,
        entry.planId,
        entry.seats
      );
  
      // API tools: usage-based, handle separately
      if (tool.category === "api") {
        return this.evaluateApiTool(entry, currentMonthlyCost);
      }
  
      // ── Rule 1: Too many seats for the plan's minimum ────────────────────────
      // Example: Claude Team requires min 2 seats. If someone has 1 seat on Team,
      // they should be on Pro instead.
      const seatCheck = this.checkSeatMismatch(entry, currentMonthlyCost);
      if (seatCheck) return seatCheck;
  
      // ── Rule 2: Annual billing saves meaningful money ────────────────────────
      const annualCheck = this.checkAnnualBilling(entry, currentMonthlyCost);
      if (annualCheck) return annualCheck;
  
      // ── Rule 3: Cheaper plan from same vendor fits use case ──────────────────
      const downgradeCheck = this.checkDowngrade(entry, currentMonthlyCost);
      if (downgradeCheck) return downgradeCheck;
  
      // ── Rule 4: Alternative tool is substantially cheaper ────────────────────
      const alternativeCheck = this.checkAlternative(entry, currentMonthlyCost);
      if (alternativeCheck) return alternativeCheck;
  
      // ── Rule 5: High spend → consider direct API ─────────────────────────────
      const apiCheck = this.checkConsiderApi(entry, currentMonthlyCost);
      if (apiCheck) return apiCheck;
  
      // Nothing better found
      return this.buildOptimalResult(
        entry,
        currentMonthlyCost,
        `${tool.name} ${currentPlan.name} is appropriately priced for your team size and use case.`
      );
    }
  
    // ── RULE IMPLEMENTATIONS ──────────────────────────────────────────────────
  
    private checkSeatMismatch(
      entry: ToolEntry,
      currentMonthlyCost: number
    ): ToolRecommendation | null {
      const currentPlan = getPlan(entry.toolId, entry.planId);
      if (!currentPlan?.minSeats) return null;
  
      // If on a team plan with only 1 person, they shouldn't be on that plan
      if (entry.seats === 1 && currentPlan.minSeats >= 2) {
        // Find the best individual plan for their use case
        const plans = PRICING_REGISTRY[entry.toolId].plans;
        const individualPlans = plans
          .filter(
            (p) =>
              !p.minSeats &&
              p.monthlyPerSeat < currentPlan.monthlyPerSeat &&
              p.bestFor.includes(this.input.primaryUseCase)
          )
          .sort((a, b) => a.monthlyPerSeat - b.monthlyPerSeat);
  
        const betterPlan = individualPlans[0];
        if (!betterPlan) return null;
  
        const recommendedCost = getMonthlyCost(
          entry.toolId,
          betterPlan.id,
          entry.seats
        );
        const savings = currentMonthlyCost - recommendedCost;
        if (savings < MIN_SAVINGS_TO_RECOMMEND) return null;
  
        return this.buildRecommendation({
          entry,
          type: "reduce_seats",
          currentMonthlyCost,
          recommendedPlanId: betterPlan.id,
          recommendedPlanName: betterPlan.name,
          recommendedMonthlyCost: recommendedCost,
          reasoning: `${PRICING_REGISTRY[entry.toolId].name} ${currentPlan.name} requires a minimum of ${currentPlan.minSeats} seats but you only have 1 user. ${betterPlan.name} ($${betterPlan.monthlyPerSeat}/mo) is the right plan for a solo user.`,
        });
      }
  
      return null;
    }
  
    private checkAnnualBilling(
      entry: ToolEntry,
      currentMonthlyCost: number
    ): ToolRecommendation | null {
      const currentPlan = getPlan(entry.toolId, entry.planId);
      if (!currentPlan?.annualMonthlyEquivalent) return null;
      if (currentPlan.annualMonthlyEquivalent >= currentPlan.monthlyPerSeat)
        return null;
  
      const annualEquivalentCost =
        currentPlan.annualMonthlyEquivalent * entry.seats;
      const savings = currentMonthlyCost - annualEquivalentCost;
      if (savings < MIN_SAVINGS_TO_RECOMMEND) return null;
  
      const annualDiscount = Math.round(
        ((currentPlan.monthlyPerSeat - currentPlan.annualMonthlyEquivalent) /
          currentPlan.monthlyPerSeat) *
          100
      );
  
      return this.buildRecommendation({
        entry,
        type: "switch_to_annual",
        currentMonthlyCost,
        recommendedPlanId: currentPlan.id,
        recommendedPlanName: `${currentPlan.name} (Annual)`,
        recommendedMonthlyCost: annualEquivalentCost,
        reasoning: `Switching ${PRICING_REGISTRY[entry.toolId].name} ${currentPlan.name} to annual billing saves ${annualDiscount}% — $${savings.toFixed(0)}/mo or $${(savings * 12).toFixed(0)}/yr — with no change in features or limits.`,
      });
    }
  
    private checkDowngrade(
      entry: ToolEntry,
      currentMonthlyCost: number
    ): ToolRecommendation | null {
      const currentPlan = getPlan(entry.toolId, entry.planId);
      if (!currentPlan) return null;
  
      const plans = PRICING_REGISTRY[entry.toolId].plans;
  
      // Find cheaper plans that cover the primary use case
      const cheaperPlans = plans
        .filter(
          (p) =>
            p.monthlyPerSeat < currentPlan.monthlyPerSeat &&
            p.monthlyPerSeat > 0 && // don't suggest free as a downgrade
            p.bestFor.includes(this.input.primaryUseCase) &&
            (!p.minSeats || entry.seats >= p.minSeats)
        )
        .sort((a, b) => b.monthlyPerSeat - a.monthlyPerSeat); // highest cheaper plan first
  
      const betterPlan = cheaperPlans[0];
      if (!betterPlan) return null;
  
      const recommendedCost = getMonthlyCost(
        entry.toolId,
        betterPlan.id,
        entry.seats
      );
      const savings = currentMonthlyCost - recommendedCost;
      if (savings < MIN_SAVINGS_TO_RECOMMEND) return null;
  
      const tool = PRICING_REGISTRY[entry.toolId];
      return this.buildRecommendation({
        entry,
        type: "downgrade_plan",
        currentMonthlyCost,
        recommendedPlanId: betterPlan.id,
        recommendedPlanName: betterPlan.name,
        recommendedMonthlyCost: recommendedCost,
        reasoning: `${tool.name} ${betterPlan.name} ($${betterPlan.monthlyPerSeat}/seat) covers ${this.input.primaryUseCase} workflows and saves $${savings.toFixed(0)}/mo vs ${currentPlan.name} — only upgrade if you're regularly hitting ${currentPlan.name} usage limits.`,
      });
    }
  
    private checkAlternative(
      entry: ToolEntry,
      currentMonthlyCost: number
    ): ToolRecommendation | null {
      const toolAlternatives = ALTERNATIVES[entry.toolId];
      if (!toolAlternatives) return null;
  
      const suggestion =
        toolAlternatives[this.input.primaryUseCase] ??
        toolAlternatives["default"];
      if (!suggestion) return null;
  
      const altPlan = getPlan(suggestion.toolId, suggestion.planId);
      if (!altPlan) return null;
  
      const recommendedCost = getMonthlyCost(
        suggestion.toolId,
        suggestion.planId,
        entry.seats
      );
      const savings = currentMonthlyCost - recommendedCost;
  
      // Only surface alternative if savings are meaningful (>15% or >$10/mo)
      const savingsPercent = savings / currentMonthlyCost;
      if (savings < MIN_SAVINGS_TO_RECOMMEND && savingsPercent < 0.15)
        return null;
  
      const altTool = PRICING_REGISTRY[suggestion.toolId];
  
      return this.buildRecommendation({
        entry,
        type: "switch_tool",
        currentMonthlyCost,
        recommendedPlanId: suggestion.planId,
        recommendedPlanName: altPlan.name,
        recommendedToolId: suggestion.toolId,
        recommendedToolName: altTool.name,
        recommendedMonthlyCost: recommendedCost,
        reasoning: suggestion.reasoning,
      });
    }
  
    private checkConsiderApi(
      entry: ToolEntry,
      currentMonthlyCost: number
    ): ToolRecommendation | null {
      // Only relevant for chat tools with high spend
      if (currentMonthlyCost < API_SPEND_REVIEW_THRESHOLD) return null;
  
      const tool = PRICING_REGISTRY[entry.toolId];
      if (tool.category !== "chat_ai") return null;
  
      // If they're spending $500+/mo on chat UI seats, direct API might be cheaper
      // This is a "consider" recommendation, not a hard switch — savings depend on usage
      const currentPlan = getPlan(entry.toolId, entry.planId);
      if (!currentPlan) return null;
  
      return this.buildRecommendation({
        entry,
        type: "consider_api",
        currentMonthlyCost,
        recommendedMonthlyCost: currentMonthlyCost * 0.6, // conservative 40% estimate
        reasoning: `At $${currentMonthlyCost.toFixed(0)}/mo across ${entry.seats} seats, direct API access (Anthropic API: $3/1M tokens, OpenAI API: $2.50–$5/1M tokens) may be significantly cheaper if your team's usage patterns are predictable. Requires engineering integration but eliminates per-seat fees entirely.`,
      });
    }
  
    private evaluateApiTool(
      entry: ToolEntry,
      currentMonthlyCost: number
    ): ToolRecommendation {
      // API tools are usage-based — we look at reported spend vs cheaper models
      const tool = PRICING_REGISTRY[entry.toolId];
      const currentPlan = getPlan(entry.toolId, entry.planId);
  
      if (!currentPlan) {
        return this.buildOptimalResult(entry, entry.monthlySpend, "API plan not found — verify manually.");
      }
  
      // If on GPT-5.5 or Opus and spend is high, suggest a cheaper model tier
      if (entry.toolId === "openai_api" && entry.planId === "gpt5_5") {
        const savings = currentMonthlyCost * 0.5; // GPT-5.4 is ~50% cheaper
        if (savings >= MIN_SAVINGS_TO_RECOMMEND) {
          return this.buildRecommendation({
            entry,
            type: "downgrade_plan",
            currentMonthlyCost,
            recommendedPlanId: "gpt5_4",
            recommendedPlanName: "GPT-5.4",
            recommendedMonthlyCost: currentMonthlyCost * 0.5,
            reasoning: `GPT-5.4 ($2.50/1M input vs $5.00) delivers comparable quality for most workloads at 50% of GPT-5.5's cost. Reserve GPT-5.5 for tasks where you've measured a meaningful quality difference.`,
          });
        }
      }
  
      if (entry.toolId === "anthropic_api" && entry.planId === "opus_4_6") {
        const savings = currentMonthlyCost * 0.4; // Sonnet is ~40% cheaper
        if (savings >= MIN_SAVINGS_TO_RECOMMEND) {
          return this.buildRecommendation({
            entry,
            type: "downgrade_plan",
            currentMonthlyCost,
            recommendedPlanId: "sonnet_4_6",
            recommendedPlanName: "Claude Sonnet 4.6",
            recommendedMonthlyCost: currentMonthlyCost * 0.6,
            reasoning: `Claude Sonnet 4.6 ($3/1M input vs $5 for Opus) handles the majority of production workloads — coding, analysis, writing — at 40% less cost. Use Opus only for tasks where you've benchmarked a measurable quality gap.`,
          });
        }
      }
  
      return this.buildOptimalResult(
        entry,
        currentMonthlyCost,
        `${tool.name} ${currentPlan.name} appears appropriately selected for your use case. Monitor monthly spend and consider batch processing (50% discount) or prompt caching (90% on repeated inputs) to reduce costs further.`
      );
    }
  
    // ── BUILDER HELPERS ───────────────────────────────────────────────────────
  
    private buildRecommendation({
      entry,
      type,
      currentMonthlyCost,
      recommendedPlanId,
      recommendedPlanName,
      recommendedToolId,
      recommendedToolName,
      recommendedMonthlyCost,
      reasoning,
    }: {
      entry: ToolEntry;
      type: RecommendationType;
      currentMonthlyCost: number;
      recommendedPlanId?: string;
      recommendedPlanName?: string;
      recommendedToolId?: ToolId;
      recommendedToolName?: string;
      recommendedMonthlyCost: number;
      reasoning: string;
    }): ToolRecommendation {
      const tool = PRICING_REGISTRY[entry.toolId];
      const currentPlan = getPlan(entry.toolId, entry.planId);
      const monthlySavings = currentMonthlyCost - recommendedMonthlyCost;
  
      return {
        toolId: entry.toolId,
        toolName: tool?.name ?? entry.toolId,
        currentPlanName: currentPlan?.name ?? entry.planId,
        currentMonthlyCost,
        recommendationType: type,
        recommendedPlanId,
        recommendedPlanName,
        recommendedToolId,
        recommendedToolName,
        recommendedMonthlyCost,
        monthlySavings,
        annualSavings: monthlySavings * 12,
        reasoning,
      };
    }
  
    private buildOptimalResult(
      entry: ToolEntry,
      currentMonthlyCost: number,
      reasoning: string
    ): ToolRecommendation {
      const tool = PRICING_REGISTRY[entry.toolId];
      const currentPlan = getPlan(entry.toolId, entry.planId);
  
      return {
        toolId: entry.toolId,
        toolName: tool?.name ?? entry.toolId,
        currentPlanName: currentPlan?.name ?? entry.planId,
        currentMonthlyCost,
        recommendationType: "already_optimal",
        recommendedMonthlyCost: currentMonthlyCost,
        monthlySavings: 0,
        annualSavings: 0,
        reasoning,
      };
    }
  
    // ── CATEGORIZATION ────────────────────────────────────────────────────────
  
    private categorizeSavings(
      monthlySavings: number
    ): "optimal" | "moderate" | "significant" {
      if (monthlySavings < 100) return "optimal";
      if (monthlySavings < 500) return "moderate";
      return "significant";
    }
  }