"use client";

/**
 * Step3TeamContext.tsx
 * Collects team size and primary use case, then submits to /api/audit/create.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuditStore } from "@/store/audit-store";
import type { UseCase } from "@/lib/pricing-registry";

const USE_CASES: { id: UseCase; label: string; description: string }[] = [
  { id: "coding", label: "Coding", description: "Writing, reviewing, and debugging code" },
  { id: "writing", label: "Writing", description: "Docs, content, emails, reports" },
  { id: "research", label: "Research", description: "Analysis, summarisation, Q&A" },
  { id: "data", label: "Data", description: "Data analysis, SQL, spreadsheets" },
  { id: "mixed", label: "Mixed", description: "A bit of everything" },
];

export function Step3TeamContext() {
  const router = useRouter();
  const {
    teamSize,
    primaryUseCase,
    setTeamSize,
    setUseCase,
    setStep,
    getToolEntries,
    resetForm,
  } = useAuditStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toolEntries = getToolEntries();
  const totalMonthly = toolEntries.reduce((sum, e) => sum + e.monthlySpend, 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/audit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tools: toolEntries,
          teamSize,
          primaryUseCase,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      const { auditId } = await response.json();
      resetForm();
      router.push(`/audit/${auditId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <p className="step-label">STEP 3 OF 3</p>
        <h2 className="step-title">Tell us about your team</h2>
        <p className="step-subtitle">
          Two quick questions. This shapes the recommendations.
        </p>
      </div>

      <div className="context-fields">
        {/* Team size */}
        <div className="context-field">
          <label className="field-label" htmlFor="team-size">
            Total team size (including non-technical)
          </label>
          <div className="team-size-input">
            <input
              id="team-size"
              type="number"
              min={1}
              max={10000}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="field-input field-input--large"
            />
            <span className="field-unit">people</span>
          </div>
          <p className="field-hint">
            Used to flag cases where per-seat counts seem high relative to team size
          </p>
        </div>

        {/* Primary use case */}
        <div className="context-field">
          <p className="field-label">Primary use case</p>
          <div className="use-case-grid">
            {USE_CASES.map(({ id, label, description }) => (
              <button
                key={id}
                onClick={() => setUseCase(id)}
                className={`use-case-card ${
                  primaryUseCase === id ? "use-case-card--selected" : ""
                }`}
                aria-pressed={primaryUseCase === id}
              >
                <span className="use-case-label">{label}</span>
                <span className="use-case-desc">{description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary before submit */}
      <div className="submit-summary">
        <div className="summary-row">
          <span className="summary-label">Tools auditing</span>
          <span className="summary-value">{toolEntries.length}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Current monthly spend</span>
          <span className="summary-value summary-value--money">
            ${totalMonthly.toLocaleString()}/mo
          </span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Current annual spend</span>
          <span className="summary-value summary-value--money">
            ${(totalMonthly * 12).toLocaleString()}/yr
          </span>
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span>⚠</span> {error}
        </div>
      )}

      <div className="step-footer">
        <button
          onClick={() => setStep(2)}
          disabled={isSubmitting}
          className="btn-secondary"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary btn-primary--large"
        >
          {isSubmitting ? (
            <span className="btn-loading">
              <span className="loading-dot" />
              Analysing your stack…
            </span>
          ) : (
            "Run Audit →"
          )}
        </button>
      </div>
    </div>
  );
}