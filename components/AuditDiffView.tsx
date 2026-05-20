"use client";

/**
 * components/AuditDiffView.tsx
 * Side-by-side diff of original audit vs re-audit with new pricing.
 * Changed rows highlighted, unchanged rows muted.
 */

import type { Recommendation } from "@/lib/audit-types";

interface AuditSnapshot {
  recommendations: Recommendation[];
  totalCurrentMonthly: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsCategory: string;
  createdAt?: string;
}

interface Props {
  auditId: string;
  originalAudit: AuditSnapshot;
  newAudit: AuditSnapshot;
  savingsDelta: number; // positive = more savings now, negative = fewer
}

export function AuditDiffView({
  auditId,
  originalAudit,
  newAudit,
  savingsDelta,
}: Props) {
  const originalDate = originalAudit.createdAt
    ? new Date(originalAudit.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Previous audit";

  // Map new recommendations by toolId for easy lookup
  const newRecMap = new Map<string, Recommendation>();
  for (const rec of newAudit.recommendations) {
    newRecMap.set(rec.toolId, rec);
  }

  // Determine which rows changed
  const rows = originalAudit.recommendations.map((orig) => {
    const newRec = newRecMap.get(orig.toolId);
    const changed =
      newRec &&
      (newRec.recommendationType !== orig.recommendationType ||
        newRec.recommendedPlanId !== orig.recommendedPlanId ||
        Math.abs(newRec.monthlySavings - orig.monthlySavings) > 0.5);
    return { orig, newRec, changed };
  });

  const changedCount = rows.filter((r) => r.changed).length;

  return (
    <div className="diff-layout">
      {/* Header */}
      <header className="results-header">
        <a href="/" className="results-brand">SpendSight</a>
        <a href={`/audit/${auditId}`} className="btn-share">
          View original audit
        </a>
      </header>

      {/* Hero */}
      <section className="diff-hero">
        <p className="savings-hero-label">PRICING UPDATE DETECTED</p>
        <h1 className="diff-hero-title">
          {changedCount === 0
            ? "No recommendations changed"
            : `${changedCount} recommendation${changedCount > 1 ? "s" : ""} updated`}
        </h1>

        {savingsDelta !== 0 && (
          <div className="diff-delta">
            <span
              className={`diff-delta-amount ${
                savingsDelta > 0 ? "diff-delta--positive" : "diff-delta--negative"
              }`}
            >
              {savingsDelta > 0 ? "+" : ""}${Math.abs(Math.round(savingsDelta))}/mo
            </span>
            <span className="diff-delta-label">
              {savingsDelta > 0
                ? "more savings available with new pricing"
                : "fewer savings vs original audit"}
            </span>
          </div>
        )}

        <p className="diff-hero-sub">
          Original audit from {originalDate} · Prices updated since then
        </p>
      </section>

      {/* Column headers */}
      <div className="diff-columns-header">
        <div className="diff-col-label diff-col-label--old">
          PREVIOUS RECOMMENDATIONS
          <span className="diff-col-date">({originalDate})</span>
        </div>
        <div className="diff-col-label diff-col-label--new">
          UPDATED RECOMMENDATIONS
          <span className="diff-col-date">(today)</span>
        </div>
      </div>

      {/* Diff rows */}
      <div className="diff-rows">
        {rows.map(({ orig, newRec, changed }) => (
          <div
            key={orig.toolId}
            className={`diff-row ${changed ? "diff-row--changed" : "diff-row--same"}`}
          >
            {/* Tool name */}
            <div className="diff-row-tool">
              <span className="diff-row-tool-name">{orig.toolName}</span>
              {changed && <span className="diff-changed-badge">CHANGED</span>}
            </div>

            {/* Old recommendation */}
            <div className="diff-cell diff-cell--old">
              <span className="diff-rec-type">{orig.recommendationType.replace(/_/g, " ")}</span>
              {orig.recommendedPlanName && (
                <span className="diff-rec-plan">→ {orig.recommendedPlanName}</span>
              )}
              <span className="diff-rec-savings">
                {orig.monthlySavings > 0
                  ? `−$${Math.round(orig.monthlySavings)}/mo`
                  : "✓ Optimal"}
              </span>
              {changed && (
                <p className="diff-rec-reasoning diff-rec-reasoning--old">
                  {orig.reasoning}
                </p>
              )}
            </div>

            {/* Arrow */}
            <div className="diff-arrow">
              {changed ? "→" : "="}
            </div>

            {/* New recommendation */}
            <div className={`diff-cell diff-cell--new ${changed ? "diff-cell--highlighted" : ""}`}>
              {newRec ? (
                <>
                  <span className="diff-rec-type">{newRec.recommendationType.replace(/_/g, " ")}</span>
                  {newRec.recommendedPlanName && (
                    <span className="diff-rec-plan">→ {newRec.recommendedPlanName}</span>
                  )}
                  <span className={`diff-rec-savings ${changed ? "diff-rec-savings--new" : ""}`}>
                    {newRec.monthlySavings > 0
                      ? `−$${Math.round(newRec.monthlySavings)}/mo`
                      : "✓ Optimal"}
                  </span>
                  {changed && (
                    <p className="diff-rec-reasoning">
                      {newRec.reasoning}
                    </p>
                  )}
                </>
              ) : (
                <span className="diff-rec-type">No change</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary totals */}
      <div className="diff-totals">
        <div className="diff-total-row">
          <span className="diff-total-label">Previous monthly savings</span>
          <span className="diff-total-value">
            ${Math.round(originalAudit.totalMonthlySavings).toLocaleString()}/mo
          </span>
        </div>
        <div className="diff-total-row">
          <span className="diff-total-label">Updated monthly savings</span>
          <span className={`diff-total-value ${savingsDelta >= 0 ? "diff-total-value--positive" : "diff-total-value--negative"}`}>
            ${Math.round(newAudit.totalMonthlySavings).toLocaleString()}/mo
          </span>
        </div>
        <div className="diff-total-row diff-total-row--delta">
          <span className="diff-total-label">Change</span>
          <span className={`diff-total-value ${savingsDelta >= 0 ? "diff-total-value--positive" : "diff-total-value--negative"}`}>
            {savingsDelta >= 0 ? "+" : ""}${Math.round(savingsDelta).toLocaleString()}/mo
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="diff-cta">
        <a href="/" className="btn-primary">
          Run a new audit →
        </a>
        <a href={`/audit/${auditId}`} className="btn-secondary">
          View original audit
        </a>
      </div>
    </div>
  );
}