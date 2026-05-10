"use client";

/**
 * Step1ToolSelect.tsx
 * Grid of AI tools the user can toggle on/off.
 * Design: dark cards with subtle border, amber highlight on selection.
 */

import { useAuditStore } from "@/store/audit-store";
import { PRICING_REGISTRY, type ToolId } from "@/lib/pricing-registry";

const TOOL_META: Record<ToolId, { icon: string; tagline: string }> = {
  cursor: { icon: "⌘", tagline: "AI code editor" },
  github_copilot: { icon: "◎", tagline: "Inline code completion" },
  claude: { icon: "✦", tagline: "Anthropic chat AI" },
  chatgpt: { icon: "◈", tagline: "OpenAI chat AI" },
  anthropic_api: { icon: "⬡", tagline: "Direct API access" },
  openai_api: { icon: "⬢", tagline: "Direct API access" },
  gemini: { icon: "◇", tagline: "Google AI assistant" },
  windsurf: { icon: "∿", tagline: "Agentic code editor" },
};

const TOOL_ORDER: ToolId[] = [
  "cursor",
  "github_copilot",
  "claude",
  "chatgpt",
  "anthropic_api",
  "openai_api",
  "gemini",
  "windsurf",
];

export function Step1ToolSelect() {
  const { selectedTools, toggleTool, setStep } = useAuditStore();

  const canContinue = selectedTools.length > 0;

  return (
    <div className="step-container">
      <div className="step-header">
        <p className="step-label">STEP 1 OF 3</p>
        <h2 className="step-title">Which AI tools does your team pay for?</h2>
        <p className="step-subtitle">Select all that apply. Include tools with free tiers if you've upgraded any seats.</p>
      </div>

      <div className="tool-grid">
        {TOOL_ORDER.map((toolId) => {
          const tool = PRICING_REGISTRY[toolId];
          const meta = TOOL_META[toolId];
          const isSelected = selectedTools.includes(toolId);

          return (
            <button
              key={toolId}
              onClick={() => toggleTool(toolId)}
              className={`tool-card ${isSelected ? "tool-card--selected" : ""}`}
              aria-pressed={isSelected}
            >
              <span className="tool-icon" aria-hidden="true">{meta.icon}</span>
              <span className="tool-name">{tool.name}</span>
              <span className="tool-tagline">{meta.tagline}</span>
              {isSelected && (
                <span className="tool-check" aria-hidden="true">✓</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="step-footer">
        <p className="selection-count">
          {selectedTools.length === 0
            ? "Select at least one tool to continue"
            : `${selectedTools.length} tool${selectedTools.length > 1 ? "s" : ""} selected`}
        </p>
        <button
          onClick={() => setStep(2)}
          disabled={!canContinue}
          className="btn-primary"
        >
          Configure Plans →
        </button>
      </div>
    </div>
  );
}