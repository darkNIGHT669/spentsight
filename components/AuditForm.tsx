"use client";

/**
 * AuditForm.tsx
 * Orchestrates the 3-step form. Renders the active step and progress bar.
 */

import { useAuditStore } from "@/store/audit-store";
import { Step1ToolSelect } from "./Step1ToolSelect";
import { Step2PlanConfig } from "./Step2PlanConfig";
import { Step3TeamContext } from "./Step3TeamContext";

const STEPS = [
  { number: 1, label: "Select tools" },
  { number: 2, label: "Configure plans" },
  { number: 3, label: "Team context" },
];

export function AuditForm() {
  const { currentStep } = useAuditStore();

  return (
    <div className="audit-form-wrapper">
      {/* Progress bar */}
      <nav className="progress-nav" aria-label="Form progress">
        {STEPS.map((step, idx) => {
          const status =
            currentStep > step.number
              ? "complete"
              : currentStep === step.number
              ? "active"
              : "upcoming";

          return (
            <div key={step.number} className="progress-step-wrapper">
              <div className={`progress-step progress-step--${status}`}>
                <span className="progress-step-number">
                  {status === "complete" ? "✓" : step.number}
                </span>
                <span className="progress-step-label">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`progress-connector ${
                    currentStep > step.number ? "progress-connector--complete" : ""
                  }`}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Active step */}
      <div className="form-step-container">
        {currentStep === 1 && <Step1ToolSelect />}
        {currentStep === 2 && <Step2PlanConfig />}
        {currentStep === 3 && <Step3TeamContext />}
      </div>
    </div>
  );
}