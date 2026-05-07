/**
 * PRICING_REGISTRY — Single source of truth for all AI tool pricing.
 * Every number here is verified against official vendor pricing pages.
 * See PRICING_DATA.md for source URLs and verification dates.
 *
 * All prices are in USD per seat per month (monthly billing).
 * Annual billing equivalents noted where available.
 *
 * Last verified: 2025-05-07
 */

export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export type ToolId =
  | "cursor"
  | "github_copilot"
  | "claude"
  | "chatgpt"
  | "anthropic_api"
  | "openai_api"
  | "gemini"
  | "windsurf";

export interface Plan {
  id: string;
  name: string;
  /** USD per seat per month, monthly billing. 0 = usage-based (API tools) */
  monthlyPerSeat: number;
  /** USD per seat per month if paying annually */
  annualMonthlyEquivalent?: number;
  /** false = flat fee / usage-based (API tools billed by token, not seats) */
  isPerSeat: boolean;
  minSeats?: number;
  bestFor: UseCase[];
  notes?: string;
}

export interface Tool {
  id: ToolId;
  name: string;
  category: "coding_assistant" | "chat_ai" | "api";
  plans: Plan[];
  sourceUrl: string;
  verifiedDate: string; // YYYY-MM-DD
}

export const PRICING_REGISTRY: Record<ToolId, Tool> = {
  // ── CURSOR ──────────────────────────────────────────────────────────────────
  cursor: {
    id: "cursor",
    name: "Cursor",
    category: "coding_assistant",
    sourceUrl: "https://cursor.com/pricing",
    verifiedDate: "2025-05-07",
    plans: [
      {
        id: "hobby",
        name: "Hobby",
        monthlyPerSeat: 0,
        isPerSeat: true,
        bestFor: ["coding"],
        notes: "Limited agent requests and tab completions. For trialling Cursor.",
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPerSeat: 20,
        isPerSeat: true,
        bestFor: ["coding"],
        notes: "Extended agent limits, frontier model access (OpenAI/Claude/Gemini), MCPs, cloud agents.",
      },
      {
        id: "pro_plus",
        name: "Pro+",
        monthlyPerSeat: 60,
        isPerSeat: true,
        bestFor: ["coding"],
        notes: "3× usage quota vs Pro on all frontier models.",
      },
      {
        id: "ultra",
        name: "Ultra",
        monthlyPerSeat: 200,
        isPerSeat: true,
        bestFor: ["coding"],
        notes: "20× usage quota vs Pro. Priority access to new features.",
      },
    ],
  },

  // ── GITHUB COPILOT ───────────────────────────────────────────────────────────
  github_copilot: {
    id: "github_copilot",
    name: "GitHub Copilot",
    category: "coding_assistant",
    sourceUrl: "https://github.com/features/copilot/plans",
    verifiedDate: "2025-05-07",
    plans: [
      {
        id: "free",
        name: "Free",
        monthlyPerSeat: 0,
        isPerSeat: true,
        bestFor: ["coding"],
        notes: "Limited completions and chat. Good for occasional use.",
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPerSeat: 10,
        isPerSeat: true,
        bestFor: ["coding"],
        notes: "Unlimited completions, chat, multi-file edits. Best value for solo developers.",
      },
      {
        id: "pro_plus",
        name: "Pro+",
        monthlyPerSeat: 39,
        isPerSeat: true,
        bestFor: ["coding"],
        notes: "Agent mode, additional models including Claude and Gemini.",
      },
    ],
  },

  // ── CLAUDE (Anthropic chat UI) ───────────────────────────────────────────────
  claude: {
    id: "claude",
    name: "Claude",
    category: "chat_ai",
    sourceUrl: "https://claude.com/pricing",
    verifiedDate: "2025-05-07",
    plans: [
      {
        id: "free",
        name: "Free",
        monthlyPerSeat: 0,
        isPerSeat: true,
        bestFor: ["writing", "research", "mixed"],
        notes: "Rate-limited. Good for light personal use.",
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPerSeat: 20,
        annualMonthlyEquivalent: 17,
        isPerSeat: true,
        bestFor: ["writing", "research", "mixed", "coding"],
        notes: "$20/mo monthly, or $17/mo when billed annually ($200/yr). Everyday productivity.",
      },
      {
        id: "max_5x",
        name: "Max (5×)",
        monthlyPerSeat: 100,
        isPerSeat: true,
        bestFor: ["writing", "research", "mixed", "coding"],
        notes: "5× the usage of Pro. For users who hit Pro limits regularly.",
      },
      {
        id: "max_20x",
        name: "Max (20×)",
        monthlyPerSeat: 200,
        isPerSeat: true,
        bestFor: ["writing", "research", "mixed", "coding"],
        notes: "20× the usage of Pro. For heavy autonomous workflows.",
      },
      {
        id: "team",
        name: "Team",
        monthlyPerSeat: 25,
        isPerSeat: true,
        minSeats: 2,
        bestFor: ["writing", "research", "mixed", "coding"],
        notes: "$25/seat/mo monthly. Minimum 2 seats. Admin controls, priority access, collaboration features.",
      },
    ],
  },

  // ── CHATGPT (OpenAI chat UI) ─────────────────────────────────────────────────
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    category: "chat_ai",
    sourceUrl: "https://chatgpt.com/pricing",
    verifiedDate: "2025-05-07",
    plans: [
      {
        id: "free",
        name: "Free",
        monthlyPerSeat: 0,
        isPerSeat: true,
        bestFor: ["writing", "research", "mixed"],
        notes: "Limited to GPT-5.3 Instant, 10 msgs/5hrs, shows ads in US.",
      },
      {
        id: "go",
        name: "Go",
        monthlyPerSeat: 8,
        isPerSeat: true,
        bestFor: ["writing", "research", "mixed"],
        notes: "Unlimited GPT-5.3 Instant, still shows ads, no GPT-5.5 access.",
      },
      {
        id: "plus",
        name: "Plus",
        monthlyPerSeat: 20,
        isPerSeat: true,
        bestFor: ["writing", "research", "mixed", "coding"],
        notes: "Ad-free, GPT-5.5 flagship, Deep Research (10 runs/mo), Sora video, Codex.",
      },
      {
        id: "pro_100",
        name: "Pro ($100)",
        monthlyPerSeat: 100,
        isPerSeat: true,
        bestFor: ["research", "data", "coding"],
        notes: "5× Plus usage limits + GPT-5.5 Pro model. Launched April 2026.",
      },
      {
        id: "pro_200",
        name: "Pro ($200)",
        monthlyPerSeat: 200,
        isPerSeat: true,
        bestFor: ["research", "data", "coding"],
        notes: "20× Plus limits, 1M-token context window, 250 Deep Research runs/month.",
      },
      {
        id: "business",
        name: "Business",
        monthlyPerSeat: 25,
        annualMonthlyEquivalent: 20,
        isPerSeat: true,
        minSeats: 2,
        bestFor: ["writing", "research", "mixed", "coding"],
        notes: "$25/seat/mo monthly or $20/seat/mo annually. 2-seat minimum. Admin controls, data privacy.",
      },
    ],
  },

  // ── ANTHROPIC API (usage-based) ──────────────────────────────────────────────
  anthropic_api: {
    id: "anthropic_api",
    name: "Anthropic API",
    category: "api",
    sourceUrl: "https://anthropic.com/pricing",
    verifiedDate: "2025-05-07",
    plans: [
      {
        id: "haiku_4_5",
        name: "Claude Haiku 4.5",
        monthlyPerSeat: 0, // usage-based, no seat fee
        isPerSeat: false,
        bestFor: ["coding", "writing", "research", "data", "mixed"],
        notes: "Usage-based: $1.00/1M input, $5.00/1M output. Fastest & cheapest. 50% batch discount available.",
      },
      {
        id: "sonnet_4_6",
        name: "Claude Sonnet 4.6",
        monthlyPerSeat: 0,
        isPerSeat: false,
        bestFor: ["coding", "writing", "research", "data", "mixed"],
        notes: "Usage-based: $3.00/1M input, $15.00/1M output. Best quality/cost balance for production.",
      },
      {
        id: "opus_4_6",
        name: "Claude Opus 4.6",
        monthlyPerSeat: 0,
        isPerSeat: false,
        bestFor: ["coding", "research", "data"],
        notes: "Usage-based: $5.00/1M input, $25.00/1M output. Flagship. 1M context window at flat rate.",
      },
    ],
  },

  // ── OPENAI API (usage-based) ─────────────────────────────────────────────────
  openai_api: {
    id: "openai_api",
    name: "OpenAI API",
    category: "api",
    sourceUrl: "https://openai.com/api/pricing",
    verifiedDate: "2025-05-07",
    plans: [
      {
        id: "gpt5_4_mini",
        name: "GPT-5.4 mini",
        monthlyPerSeat: 0,
        isPerSeat: false,
        bestFor: ["coding", "writing", "research", "data", "mixed"],
        notes: "Usage-based: $0.75/1M input, $4.50/1M output. Budget-friendly.",
      },
      {
        id: "gpt5_4",
        name: "GPT-5.4",
        monthlyPerSeat: 0,
        isPerSeat: false,
        bestFor: ["coding", "writing", "research", "data", "mixed"],
        notes: "Usage-based: $2.50/1M input, $15.00/1M output. Affordable mid-tier.",
      },
      {
        id: "gpt5_5",
        name: "GPT-5.5",
        monthlyPerSeat: 0,
        isPerSeat: false,
        bestFor: ["coding", "research", "data"],
        notes: "Usage-based: $5.00/1M input, $30.00/1M output. Top-tier for coding and complex work.",
      },
    ],
  },

  // ── GEMINI (Google) ──────────────────────────────────────────────────────────
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    category: "chat_ai",
    sourceUrl: "https://one.google.com/intl/en/about/google-one/ai-premium",
    verifiedDate: "2025-05-07",
    plans: [
      {
        id: "free",
        name: "Free",
        monthlyPerSeat: 0,
        isPerSeat: true,
        bestFor: ["writing", "research", "mixed"],
        notes: "Basic Gemini access. Rate limited.",
      },
      {
        id: "ai_plus",
        name: "Google AI Plus",
        monthlyPerSeat: 7.99,
        isPerSeat: true,
        bestFor: ["writing", "research", "mixed"],
        notes: "More Gemini access. Bundled with Google One storage and family sharing up to 5 members.",
      },
      {
        id: "ai_pro",
        name: "Google AI Pro",
        monthlyPerSeat: 19.99,
        isPerSeat: true,
        bestFor: ["writing", "research", "data", "mixed"],
        notes: "Higher Gemini 3 Pro limits. Includes Google One storage and family sharing.",
      },
      {
        id: "ai_ultra",
        name: "Google AI Ultra",
        monthlyPerSeat: 249.99,
        isPerSeat: true,
        bestFor: ["research", "data", "mixed"],
        notes: "Highest Gemini 3 Pro access, exclusive features, Google One Ultra storage tier.",
      },
    ],
  },

  // ── WINDSURF ─────────────────────────────────────────────────────────────────
  windsurf: {
    id: "windsurf",
    name: "Windsurf",
    category: "coding_assistant",
    sourceUrl: "https://windsurf.com/pricing",
    verifiedDate: "2025-05-07",
    plans: [
      {
        id: "free",
        name: "Free",
        monthlyPerSeat: 0,
        isPerSeat: true,
        bestFor: ["coding"],
        notes: "Light quota. Unlimited inline edits and tab completions. Limited model availability.",
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPerSeat: 20,
        isPerSeat: true,
        bestFor: ["coding"],
        notes: "Full frontier model access (OpenAI, Claude, Gemini). Devin Cloud sessions. 2-week free trial.",
      },
      {
        id: "max",
        name: "Max",
        monthlyPerSeat: 200,
        isPerSeat: true,
        bestFor: ["coding"],
        notes: "Significantly higher quotas than Pro. For heavy agentic coding use.",
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getPlan(toolId: ToolId, planId: string): Plan | undefined {
  return PRICING_REGISTRY[toolId]?.plans.find((p) => p.id === planId);
}

export function getPlans(toolId: ToolId): Plan[] {
  return PRICING_REGISTRY[toolId]?.plans ?? [];
}

/** Total monthly cost for N seats on a given plan */
export function getMonthlyCost(
  toolId: ToolId,
  planId: string,
  seats: number
): number {
  const plan = getPlan(toolId, planId);
  if (!plan) return 0;
  if (!plan.isPerSeat) return plan.monthlyPerSeat;
  return plan.monthlyPerSeat * seats;
}

/** Cheapest plan for a given use case */
export function getCheapestPlanForUseCase(
  toolId: ToolId,
  useCase: UseCase
): Plan | undefined {
  return getPlans(toolId)
    .filter((p) => p.bestFor.includes(useCase))
    .sort((a, b) => a.monthlyPerSeat - b.monthlyPerSeat)[0];
}