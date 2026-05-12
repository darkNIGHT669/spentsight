"use client";

/**
 * components/AuditResultsClient.tsx
 * Client component for the results page.
 * Handles: share button, email capture modal, Credex CTA.
 */

import { useState } from "react";
import Link from 'next/link';
import type { Recommendation } from "@/lib/audit-types";

const RECOMMENDATION_LABELS: Record<string, string> = {
  downgrade_plan: "Downgrade plan",
  switch_tool: "Switch tool",
  reduce_seats: "Reduce seats",
  switch_to_annual: "Switch to annual",
  already_optimal: "Already optimal",
  consider_api: "Consider direct API",
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  downgrade_plan: "rec--savings",
  switch_tool: "rec--savings",
  reduce_seats: "rec--savings",
  switch_to_annual: "rec--savings",
  already_optimal: "rec--optimal",
  consider_api: "rec--consider",
};

interface Props {
  auditId: string;
  totalCurrentMonthly: number;
  totalRecommendedMonthly: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsCategory: "optimal" | "moderate" | "significant";
  aiSummary: string;
  recommendations: Recommendation[];
  createdAt: string;
}

export function AuditResultsClient({
  auditId,
  totalCurrentMonthly,
  totalMonthlySavings,
  totalAnnualSavings,
  savingsCategory,
  aiSummary,
  recommendations,
  createdAt,
}: Props) {
  //const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/audit/${auditId}`;
  const isSignificant = savingsCategory === "significant";
  const isOptimal = savingsCategory === "optimal";

  const handleShare = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailSubmit = async () => {
    setIsSubmitting(true);
    setEmailError(null);

    try {
      const res = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          email,
          companyName,
          role,
          monthlySavings: totalMonthlySavings,
          _hp: "", // honeypot — bots fill this
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Something went wrong.");
      }

      setEmailSubmitted(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const auditDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="results-layout">
      {/* Header */}
      <header className="results-header">
        <Link href="/" className="results-brand">SpendSight</Link>
        <div className="results-meta">
          <span className="results-date">Audited {auditDate}</span>
          <button onClick={handleShare} className="btn-share">
            {copied ? "✓ Copied" : "Share audit"}
          </button>
        </div>
      </header>

      {/* Hero savings block */}
      <section className="savings-hero">
        {isOptimal ? (
          <>
            <p className="savings-hero-label">AUDIT RESULT</p>
            <h1 className="savings-hero-amount savings-hero-amount--optimal">
              Stack optimised ✓
            </h1>
            <p className="savings-hero-sub">
              Current monthly spend: ${totalCurrentMonthly.toLocaleString()}/mo ·
              No significant savings identified
            </p>
          </>
        ) : (
          <>
            <p className="savings-hero-label">POTENTIAL ANNUAL SAVINGS</p>
            <h1 className="savings-hero-amount">
              ${Math.round(totalAnnualSavings).toLocaleString()}
              <span className="savings-hero-period">/yr</span>
            </h1>
            <p className="savings-hero-sub">
              ${Math.round(totalMonthlySavings).toLocaleString()}/mo · from $
              {Math.round(totalCurrentMonthly).toLocaleString()} → $
              {Math.round(totalCurrentMonthly - totalMonthlySavings).toLocaleString()}/mo
            </p>
          </>
        )}
      </section>

      {/* Credex CTA — only for significant savings */}
      {isSignificant && (
        <section className="credex-cta">
          <div className="credex-cta-inner">
            <div className="credex-cta-text">
              <p className="credex-cta-label">CAPTURE MORE SAVINGS</p>
              <h2 className="credex-cta-title">
                You may qualify for an additional 20–40% off via Credex
              </h2>
              <p className="credex-cta-desc">
                Credex sources discounted AI infrastructure credits — Cursor,
                Claude, ChatGPT Enterprise — from companies that overforecast.
                Teams with your spend profile typically save an additional $
                {Math.round(totalMonthlySavings * 0.3).toLocaleString()}/mo on
                top of these optimisations.
              </p>
            </div>
            <a
              href="https://credex.rocks"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-credex"
            >
              Book a Credex consultation →
            </a>
          </div>
        </section>
      )}

      {/* AI Summary */}
      <section className="ai-summary">
        <p className="ai-summary-label">AI ANALYSIS</p>
        <p className="ai-summary-text">{aiSummary}</p>
      </section>

      {/* Per-tool breakdown */}
      <section className="recommendations-section">
        <h2 className="section-title">Per-tool breakdown</h2>
        <div className="recommendations-list">
          {recommendations.map((rec, idx) => (
            <div key={idx} className={`rec-card ${RECOMMENDATION_COLORS[rec.recommendationType]}`}>
              <div className="rec-header">
                <div className="rec-tool-info">
                  <h3 className="rec-tool-name">{rec.toolName}</h3>
                  <span className="rec-current-plan">{rec.currentPlanName}</span>
                </div>
                <div className="rec-savings-block">
                  {rec.monthlySavings > 0 ? (
                    <>
                      <span className="rec-savings-amount">
                        −${Math.round(rec.monthlySavings).toLocaleString()}/mo
                      </span>
                      <span className="rec-savings-annual">
                        ${Math.round(rec.annualSavings).toLocaleString()}/yr
                      </span>
                    </>
                  ) : (
                    <span className="rec-optimal-badge">✓ Optimal</span>
                  )}
                </div>
              </div>

              <div className="rec-action">
                <span className={`rec-type-badge rec-type-badge--${rec.recommendationType}`}>
                  {RECOMMENDATION_LABELS[rec.recommendationType]}
                </span>
                {rec.recommendedPlanName && (
                  <span className="rec-target">
                    → {rec.recommendedToolName
                      ? `${rec.recommendedToolName} ${rec.recommendedPlanName}`
                      : rec.recommendedPlanName}
                  </span>
                )}
              </div>

              <p className="rec-reasoning">{rec.reasoning}</p>

              <div className="rec-cost-compare">
                <span className="rec-cost-current">
                  ${Math.round(rec.currentMonthlyCost).toLocaleString()}/mo now
                </span>
                {rec.monthlySavings > 0 && (
                  <>
                    <span className="rec-cost-arrow">→</span>
                    <span className="rec-cost-recommended">
                      ${Math.round(rec.recommendedMonthlyCost).toLocaleString()}/mo recommended
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Email capture — shown after value, never before */}
      {!emailSubmitted ? (
        <section className="email-capture">
          <div className="email-capture-inner">
            <div className="email-capture-text">
              <h2 className="email-capture-title">
                {isOptimal
                  ? "Get notified when new savings apply to your stack"
                  : "Get this report in your inbox"}
              </h2>
              <p className="email-capture-sub">
                {isOptimal
                  ? "AI pricing changes frequently. We'll alert you when a better option appears."
                  : "We'll email you the full breakdown plus a shareable link."}
              </p>
            </div>

            <div className="email-form">
              <input
                type="text"
                name="_hp"
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />
              <div className="email-form-fields">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input email-input"
                />
                <input
                  type="text"
                  placeholder="Company (optional)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="field-input"
                />
                <input
                  type="text"
                  placeholder="Your role (optional)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="field-input"
                />
              </div>
              {emailError && (
                <p className="email-error">{emailError}</p>
              )}
              <button
                onClick={handleEmailSubmit}
                disabled={!email || isSubmitting}
                className="btn-primary btn-primary--large"
              >
                {isSubmitting ? "Sending…" : isOptimal ? "Notify me →" : "Send report →"}
              </button>
              <p className="email-privacy">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="email-capture email-capture--submitted">
          <p className="email-submitted-icon">✓</p>
          <p className="email-submitted-title">Report sent to {email}</p>
          <p className="email-submitted-sub">Check your inbox in the next few minutes.</p>
        </section>
      )}

      {/* Share footer */}
      <section className="share-footer">
        <p className="share-footer-text">
          Know a team overpaying for AI tools?
        </p>
        <button onClick={handleShare} className="btn-share btn-share--large">
          {copied ? "✓ Link copied!" : "Share this audit tool →"}
        </button>
        <p className="share-footer-url">{shareUrl}</p>
      </section>
    </div>
  );
}