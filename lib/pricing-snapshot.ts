/**
 * lib/pricing-snapshot.ts
 *
 * Captures a snapshot of the current PRICING_REGISTRY at the moment
 * an audit is created. This snapshot is stored alongside the audit result
 * so we can later detect when pricing has changed and the audit is stale.
 */

import { PRICING_REGISTRY, type ToolId } from "./pricing-registry";

export interface PlanSnapshot {
  planId: string;
  planName: string;
  monthlyPerSeat: number;
  annualMonthlyEquivalent?: number;
}

export interface ToolSnapshot {
  toolId: ToolId;
  toolName: string;
  plans: PlanSnapshot[];
}

export type PricingSnapshot = Record<ToolId, ToolSnapshot>;

export interface PricingChange {
  toolId: ToolId;
  toolName: string;
  planId: string;
  planName: string;
  oldPrice: number;
  newPrice: number;
  delta: number; // newPrice - oldPrice (negative = cheaper)
}

/**
 * Captures the current state of the pricing registry.
 * Call this at audit creation time and store the result.
 */
export function capturePricingSnapshot(): PricingSnapshot {
  const snapshot: Partial<PricingSnapshot> = {};

  for (const [toolId, tool] of Object.entries(PRICING_REGISTRY)) {
    snapshot[toolId as ToolId] = {
      toolId: toolId as ToolId,
      toolName: tool.name,
      plans: tool.plans.map((plan) => ({
        planId: plan.id,
        planName: plan.name,
        monthlyPerSeat: plan.monthlyPerSeat,
        annualMonthlyEquivalent: plan.annualMonthlyEquivalent,
      })),
    };
  }

  return snapshot as PricingSnapshot;
}

/**
 * Compares a stored snapshot against current pricing.
 * Returns an array of changes — empty array means nothing changed.
 */
export function detectPricingChanges(
  storedSnapshot: PricingSnapshot
): PricingChange[] {
  const changes: PricingChange[] = [];
  const currentSnapshot = capturePricingSnapshot();

  for (const toolId of Object.keys(storedSnapshot) as ToolId[]) {
    const storedTool = storedSnapshot[toolId];
    const currentTool = currentSnapshot[toolId];

    // Tool removed entirely from registry
    if (!currentTool) continue;

    for (const storedPlan of storedTool.plans) {
      const currentPlan = currentTool.plans.find(
        (p) => p.planId === storedPlan.planId
      );

      // Plan removed
      if (!currentPlan) continue;

      // Price changed
      if (currentPlan.monthlyPerSeat !== storedPlan.monthlyPerSeat) {
        changes.push({
          toolId,
          toolName: storedTool.toolName,
          planId: storedPlan.planId,
          planName: storedPlan.planName,
          oldPrice: storedPlan.monthlyPerSeat,
          newPrice: currentPlan.monthlyPerSeat,
          delta: currentPlan.monthlyPerSeat - storedPlan.monthlyPerSeat,
        });
      }
    }
  }

  return changes;
}

/**
 * Checks if a specific audit's input tools are affected by a set of changes.
 * Returns only the changes that affect the tools in this audit.
 */
export function getChangesAffectingAudit(
  auditTools: { toolId: ToolId; planId: string }[],
  allChanges: PricingChange[]
): PricingChange[] {
  return allChanges.filter((change) =>
    auditTools.some(
      (t) => t.toolId === change.toolId && t.planId === change.planId
    )
  );
}

/**
 * Generates a version string from a snapshot for quick comparison.
 * Format: "cursor:pro:20|github_copilot:pro:10|..."
 */
export function snapshotVersion(snapshot: PricingSnapshot): string {
  return Object.entries(snapshot)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([toolId, tool]) =>
      tool.plans.map((p) => `${toolId}:${p.planId}:${p.monthlyPerSeat}`)
    )
    .join("|");
}