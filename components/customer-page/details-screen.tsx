"use client";

/**
 * The "write it for me" questions (owner request, 2026-10-14). A few short
 * questions, tailored to the business type. Every answer is optional and the
 * review is built only from what the customer tells us (lib/mock/review.ts).
 */

import type { BrandTheme } from "@/lib/brand/theme";
import type { BusinessType } from "@/lib/brand/tokens";
import { reviewQuestionsFor, type ReviewAnswers } from "@/lib/mock/review";
import { BackButton } from "./back-button";

const INPUT =
  "w-full rounded-control border border-black/15 bg-white px-md py-sm text-[15px] text-ink placeholder:text-ink-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";

export function DetailsScreen({
  businessType,
  theme,
  answers,
  onChange,
  onGenerate,
  onBack,
}: {
  businessType: BusinessType;
  theme: BrandTheme;
  answers: ReviewAnswers;
  onChange: (next: ReviewAnswers) => void;
  onGenerate: () => void;
  onBack: () => void;
}) {
  const questions = reviewQuestionsFor(businessType);
  const answered = Object.values(answers).some((value) => value.trim() !== "");

  return (
    <div>
      <BackButton
        label="A few quick questions"
        onBack={onBack}
        color={theme.primary}
        onPrimary={theme.onPrimary}
      />

      <p className="mt-lg text-[14px] leading-relaxed text-ink-muted">
        Answer as much or as little as you like — we only use what you tell us.
      </p>

      <div className="mt-xl grid gap-lg">
        {questions.map((question) => (
          <fieldset key={question.id}>
            <legend className="text-[15px] font-medium text-ink">
              {question.label}
            </legend>
            {question.kind === "text" ? (
              <input
                type="text"
                value={answers[question.id] ?? ""}
                maxLength={question.maxLength ?? 100}
                placeholder={question.placeholder}
                onChange={(event) =>
                  onChange({ ...answers, [question.id]: event.target.value })
                }
                className={`${INPUT} mt-sm`}
              />
            ) : (
              <div className="mt-sm flex flex-wrap gap-sm">
                {question.options?.map((option) => {
                  const selected = answers[question.id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        onChange({
                          ...answers,
                          [question.id]: selected ? "" : option,
                        })
                      }
                      className={`inline-flex min-h-[38px] items-center rounded-pill border px-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        selected
                          ? "border-[var(--cp-primary)] bg-[var(--cp-primary)] text-[var(--cp-on-primary)]"
                          : "border-black/15 bg-white text-ink hover:bg-black/[0.03]"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        disabled={!answered}
        onClick={onGenerate}
        className="mt-2xl inline-flex min-h-[56px] w-full items-center justify-center rounded-control bg-[var(--cp-primary)] px-lg text-[17px] font-medium text-[var(--cp-on-primary)] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Write my review
      </button>
      <p className="mt-sm text-center text-[12px] text-ink-muted">
        {answered
          ? "Your words, just polished — nothing made up."
          : "Add at least one answer to continue — or go back and post on Google directly."}
      </p>
    </div>
  );
}
