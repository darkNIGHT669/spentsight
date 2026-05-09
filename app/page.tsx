/**
 * app/page.tsx — Landing page + form host
 * Dark financial-grade aesthetic. Bloomberg terminal meets modern SaaS.
 */

import { AuditForm } from "@/components/AuditForm";

export const metadata = {
  title: "SpendSight — AI Spend Audit for Dev Teams",
  description:
    "Find out where your team is overpaying for AI tools. Free, instant, no login required.",
};

export default function HomePage() {
  return (
    <main className="main-layout">
      {/* Hero */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span className="eyebrow-dot" />
          Free · No login · Results in 60 seconds
        </div>
        <h1 className="hero-title">
          Is your team<br />
          <span className="hero-title--accent">overpaying for AI?</span>
        </h1>
        <p className="hero-subtitle">
          Most dev teams pay for Cursor, Copilot, ChatGPT, and Claude without
          ever benchmarking the cost. SpendSight audits your stack in 60 seconds
          and shows you exactly where to cut.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-number">$4,200</span>
            <span className="hero-stat-label">avg annual savings found</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-number">8</span>
            <span className="hero-stat-label">tools audited</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-number">60s</span>
            <span className="hero-stat-label">to your audit</span>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="form-section" id="audit">
        <AuditForm />
      </section>

      {/* Trust signals */}
      <section className="trust-section">
        <p className="trust-label">PRICING DATA VERIFIED FROM</p>
        <div className="trust-logos">
          {["Cursor", "GitHub", "Anthropic", "OpenAI", "Google", "Windsurf"].map(
            (name) => (
              <span key={name} className="trust-logo">
                {name}
              </span>
            )
          )}
        </div>
        <p className="trust-note">
          No AI used in the audit math. Every recommendation traces to an
          official pricing page.
        </p>
      </section>
    </main>
  );
}