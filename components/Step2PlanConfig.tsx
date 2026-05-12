"use client";

/**
 * Step2PlanConfig.tsx
 * For each selected tool, user picks their plan and enters seat count.
 * Monthly spend auto-calculates from registry; user can override.
 */

import { useAuditStore } from "@/store/audit-store";
import { PRICING_REGISTRY, getMonthlyCost, type ToolId } from "@/lib/pricing-registry";

export function Step2PlanConfig() {
  const { selectedTools, toolEntries, updateToolEntry, setStep } = useAuditStore();

  const allConfigured = selectedTools.every((toolId) => {
    const entry = toolEntries[toolId];
    return entry?.planId && entry.planId !== "";
  });

  const handlePlanChange = (toolId: ToolId, planId: string) => {
    const entry = toolEntries[toolId];
    const seats = entry?.seats ?? 1;
    const calculatedSpend = getMonthlyCost(toolId, planId, seats);
    updateToolEntry(toolId, {
      planId,
      monthlySpend: calculatedSpend,
    });
  };

  const handleSeatsChange = (toolId: ToolId, seats: number) => {
    const entry = toolEntries[toolId];
    const planId = entry?.planId ?? "";
    const calculatedSpend = getMonthlyCost(toolId, planId, seats);
    updateToolEntry(toolId, {
      seats,
      monthlySpend: calculatedSpend,
    });
  };

  const handleSpendOverride = (toolId: ToolId, monthlySpend: number) => {
    updateToolEntry(toolId, { monthlySpend });
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <p className="step-label">STEP 2 OF 3</p>
        <h2 className="step-title">Configure your plans</h2>
        <p className="step-subtitle">
          We auto-calculate spend from official pricing. Override if your actual
          bill differs.
        </p>
      </div>

      <div className="tool-config-list">
        {selectedTools.map((toolId) => {
          const tool = PRICING_REGISTRY[toolId];
          const entry = toolEntries[toolId];
          const selectedPlanId = entry?.planId ?? "";
          const seats = entry?.seats ?? 1;
          const monthlySpend = entry?.monthlySpend ?? 0;
          const isApi = tool.category === "api";

          return (
            <div key={toolId} className="tool-config-card">
              <div className="tool-config-header">
                <h3 className="tool-config-name">{tool.name}</h3>
                <span className="tool-config-category">
                  {tool.category === "coding_assistant"
                    ? "Code assistant"
                    : tool.category === "chat_ai"
                      ? "Chat AI"
                      : "API · usage-based"}
                </span>
              </div>

              <div className="tool-config-fields">
                {/* Plan selector */}
                <div className="field-group">
                  <label className="field-label" htmlFor={`plan-${toolId}`}>
                    Current plan
                  </label>
                  <select
                    id={`plan-${toolId}`}
                    value={selectedPlanId}
                    onChange={(e) => handlePlanChange(toolId, e.target.value)}
                    className="field-select"
                  >
                    <option value="">Select plan…</option>
                    {tool.plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                        {plan.monthlyPerSeat > 0 && !isApi
                          ? ` — $${plan.monthlyPerSeat}/seat/mo`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seats — only for per-seat tools */}
                {!isApi && (
                  <div className="field-group field-group--small">
                    <label className="field-label" htmlFor={`seats-${toolId}`}>
                      Seats
                    </label>
                    <input
                      id={`seats-${toolId}`}
                      type="number"
                      min={1}
                      max={500}
                      value={seats}
                      onChange={(e) =>
                        handleSeatsChange(toolId, Number(e.target.value))
                      }
                      className="field-input"
                    />
                  </div>
                )}

                {/* Monthly spend — always shown, auto-calculated or overrideable */}
                <div className="field-group field-group--small">
                  <label className="field-label" htmlFor={`spend-${toolId}`}>
                    {isApi ? "Monthly bill ($)" : "Monthly total ($)"}
                  </label>
                  <div className="spend-input-wrapper">
                    <span className="spend-prefix">$</span>
                    <input
                      id={`spend-${toolId}`}
                      type="number"
                      min={0}
                      value={monthlySpend}
                      onChange={(e) =>
                        handleSpendOverride(toolId, Number(e.target.value))
                      }
                      className="field-input field-input--spend"
                      placeholder="0"
                    />
                  </div>
                  {isApi && (
                    <p className="field-hint">
                      Enter your actual last month&apos;s API bill
                    </p>
                  )}
                  {!isApi && selectedPlanId && (
                    <p className="field-hint">
                      Auto-calculated · edit if your bill differs
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="step-footer">
        <button onClick={() => setStep(1)} className="btn-secondary">
          ← Back
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={!allConfigured}
          className="btn-primary"
        >
          {allConfigured ? "Almost done →" : "Configure all tools to continue"}
        </button>
      </div>
    </div>
  );
}