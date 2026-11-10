"use client";

/**
 * The consistent "this plan does not include this feature" panel, used by the
 * loyalty page and the table/room ordering routes. It is NOT a 404: the
 * business's category may get the feature, its plan just has not unlocked it
 * yet. Access decisions come from `lib/plan-features.ts`.
 */

import { ButtonLink } from "@/components/button";
import type { DemoScenario } from "@/lib/mock/demo";

export function PlanFeatureGate({
  eyebrow = "Plan feature",
  title,
  message,
  demo,
}: {
  eyebrow?: string;
  title: string;
  message: string;
  demo: DemoScenario;
}) {
  return (
    <div className="mx-auto max-w-xl py-3xl text-center">
      <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-brand-green">
        {eyebrow}
      </p>
      <h1 className="mt-md font-display text-[28px] font-medium leading-tight sm:text-[34px]">
        {title}
      </h1>
      <p className="mt-lg text-[15px] leading-relaxed text-ink-muted">{message}</p>
      <div className="mt-2xl flex flex-wrap justify-center gap-md">
        <ButtonLink href={`/billing?demo=${demo}`} size="lg">
          View plans
        </ButtonLink>
        <ButtonLink
          href={`/dashboard?demo=${demo}`}
          variant="secondary"
          size="lg"
        >
          Back to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
