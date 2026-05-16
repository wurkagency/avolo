"use client";

import { cn } from "@/lib/utils/cn";

interface StepWrapperProps {
  step: number;        // 1-based current step
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** Show submit button instead of "Continue" on last step */
  isLast?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}

export function StepWrapper({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  isLast = false,
  onSubmit,
  submitLabel = "Search",
  submitDisabled = false,
}: StepWrapperProps) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Progress bar */}
      <div className="h-1 bg-surface w-full" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps}>
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 px-6 py-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-steel hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
          </button>
        )}
        <span
          className="text-steel ml-auto"
          style={{ fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: 500 }}
        >
          {step} / {totalSteps}
        </span>
      </div>

      {/* Content — centered, max-width container */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="w-full max-w-xl mx-auto flex flex-col gap-8" style={{ animation: "stepSlideIn 0.25s ease forwards" }}>
          {/* Heading */}
          <div className="flex flex-col gap-2">
            <h1
              className="text-ink"
              style={{
                fontFamily: "var(--font-editorial)",
                fontSize: "clamp(28px, 5vw, 40px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-steel"
                style={{ fontFamily: "var(--font-inter)", fontSize: "16px", lineHeight: "1.5" }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Step content */}
          {children}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            {isLast ? (
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitDisabled}
                className={cn(
                  "w-full py-4 rounded-lg text-center transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  submitDisabled
                    ? "bg-surface text-steel cursor-not-allowed opacity-50"
                    : "bg-primary text-on-primary hover:opacity-90 cursor-pointer",
                )}
                style={{ fontFamily: "var(--font-inter)", fontSize: "17px", fontWeight: 700 }}
              >
                {submitLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled}
                className={cn(
                  "w-full py-4 rounded-lg text-center transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  nextDisabled
                    ? "bg-surface text-steel cursor-not-allowed opacity-50"
                    : "bg-primary text-on-primary hover:opacity-90 cursor-pointer",
                )}
                style={{ fontFamily: "var(--font-inter)", fontSize: "17px", fontWeight: 700 }}
              >
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes stepSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
