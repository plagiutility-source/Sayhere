"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { getBrandTheme } from "@/lib/brand/theme";
import {
  busiestDaySummary,
  dailyScanBuckets,
  pendingFeedback,
  pendingWeekOverWeek,
  positiveCount,
  positiveRate,
  reviewOfTheWeek,
  reviewsCollected,
  reviewsWeekOverWeek,
  scanWeekOverWeek,
  streakDaysWithoutNegative,
  totalScans,
} from "@/lib/dashboard/metrics";
import { getDashboardMock, MOCK_NOW } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";
import { useMockBusiness } from "@/lib/use-business";
import { AutoReplyCard } from "./auto-reply";
import { BarChart } from "./bar-chart";
import { EmptyFeedback, ShareQrPlaceholder } from "./empty-state";
import { FeedbackList, feedbackDisplayName } from "./feedback-list";
import { Gauge } from "./gauge";
import { DownloadIcon, PlusIcon } from "./icons";
import { PlanWidget } from "./plan-widget";
import { ReviewOfTheWeek } from "./review-of-the-week";
import { SectionError } from "./section-error";
import {
  CardSkeleton,
  FeedbackListSkeleton,
  PlanWidgetSkeleton,
  StatCardSkeleton,
} from "./skeletons";
import { StatCard } from "./stat-card";
import { StreakBanner } from "./streak-banner";

/** Header block: title + subtitle on the left; Export + Add location on the right. */
function DashboardHeader({ businessName }: { businessName: string }) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">
          Dashboard
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          How {businessName} is doing this week.
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 lg:items-end">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            title="Coming later"
            className="inline-flex h-10 items-center gap-2 rounded-control border border-black/15 bg-white px-3 text-[13px] text-ink-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <DownloadIcon size={16} />
            Export
          </button>
          <button
            type="button"
            disabled
            title="Extra locations are available on the Enterprise plan"
            className="inline-flex h-10 items-center gap-2 rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon size={16} />
            Add location
          </button>
        </div>
        {/* Add location is disabled because every mock plan allows 1 location. */}
        <p className="text-[12px] text-ink-muted">
          Extra locations are available on the Enterprise plan.{" "}
          <Link
            href="/contact"
            className="font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            Contact us
          </Link>
        </p>
      </div>
    </header>
  );
}

function LoadingSections() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CardSkeleton bodyHeight={160} />
        </div>
        <div className="lg:col-span-2">
          <CardSkeleton circle />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-card border border-black/10 bg-white p-lg shadow-soft lg:col-span-2">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-muted" />
          <div className="mt-lg">
            <FeedbackListSkeleton />
          </div>
        </div>
        <div className="lg:col-span-1">
          <PlanWidgetSkeleton />
        </div>
      </div>
      <CardSkeleton bodyHeight={72} />
    </>
  );
}

export function DashboardContent({ demo }: { demo: DemoScenario }) {
  const mock = useMemo(() => getDashboardMock(demo), [demo]);
  // MOCK ONLY, removed in Stage 4: the shared profile (localStorage) on top of
  // the scenario mock; `long-name` keeps its own base.
  const business = useMockBusiness(mock.business, demo !== "long-name");
  const theme = useMemo(() => getBrandTheme(business), [business]);
  const now = MOCK_NOW;

  // Error state: Retry re-renders the normal mock data (no refetch).
  const [recovered, setRecovered] = useState(false);
  const loading = mock.loading;
  const errored = mock.error && !recovered;
  const isEmpty = demo === "empty";

  const buckets = useMemo(
    () => dailyScanBuckets(mock.scans, now),
    [mock.scans, now],
  );
  const summary = busiestDaySummary(buckets);
  const rate = positiveRate(mock.feedback);
  const streak = streakDaysWithoutNegative(mock.feedback, now);
  const review = reviewOfTheWeek(mock.feedback);
  const showExtras = !loading && !errored && !isEmpty;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader businessName={business.name} />

      {loading ? (
        <LoadingSections />
      ) : (
        <>
          {/* Stats */}
          {errored ? (
            <Card title="Overview">
              <SectionError onRetry={() => setRecovered(true)} label="your stats" />
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Total scans"
                value={String(totalScans(mock.scans))}
                week={scanWeekOverWeek(mock.scans, now)}
              />
              <StatCard
                label="Reviews collected"
                value={String(reviewsCollected(mock.feedback))}
                week={reviewsWeekOverWeek(mock.feedback, now)}
              />
              <StatCard
                label="Pending feedback"
                value={String(pendingFeedback(mock.feedback))}
                week={pendingWeekOverWeek(mock.feedback, now)}
              />
            </div>
          )}

          {/* Chart + gauge (empty -> share-QR placeholder; error -> per-card retry) */}
          {errored ? (
            <div className="grid gap-3 lg:grid-cols-5">
              <Card title="Weekly scan activity" className="h-full lg:col-span-3">
                <SectionError
                  onRetry={() => setRecovered(true)}
                  label="your scan activity"
                />
              </Card>
              <Card title="Positive rate" className="h-full lg:col-span-2">
                <SectionError
                  onRetry={() => setRecovered(true)}
                  label="the positive rate"
                />
              </Card>
            </div>
          ) : isEmpty ? (
            <ShareQrPlaceholder />
          ) : (
            <div className="grid gap-3 lg:grid-cols-5">
              <Card title="Weekly scan activity" className="h-full lg:col-span-3">
                <BarChart buckets={buckets} color={theme.primary} summary={summary} />
              </Card>
              <Card title="Positive rate" className="h-full lg:col-span-2">
                <div className="flex h-full flex-col items-center justify-center gap-3 py-2">
                  <Gauge value={rate} color={theme.primary} />
                  <p className="text-[12px] text-ink-muted">
                    {positiveCount(mock.feedback)} of {mock.feedback.length}{" "}
                    feedback positive
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Streak extra */}
          {showExtras && streak > 0 ? (
            <StreakBanner days={streak} color={theme.primary} />
          ) : null}

          {/* Recent feedback + plan */}
          <div className="grid gap-3 lg:grid-cols-3">
            <Card title="Recent feedback" className="lg:col-span-2">
              {errored ? (
                <SectionError
                  onRetry={() => setRecovered(true)}
                  label="recent feedback"
                />
              ) : isEmpty || mock.feedback.length === 0 ? (
                <EmptyFeedback />
              ) : (
                <FeedbackList rows={mock.feedback} max={5} viewAllHref="/feedback" />
              )}
            </Card>
            {errored ? (
              <Card title="Plan" className="h-full">
                <SectionError
                  onRetry={() => setRecovered(true)}
                  label="your plan"
                />
              </Card>
            ) : (
              <PlanWidget
                status={mock.status}
                plan={mock.plan}
                color={theme.primary}
              />
            )}
          </div>

          {/* Auto-reply entry point (PRD.md 5.4.3). */}
          <AutoReplyCard scenario={demo} plan={mock.plan} />

          {/* Review of the week extra */}
          {showExtras && review ? (
            <ReviewOfTheWeek
              businessName={business.name}
              customer={feedbackDisplayName(review)}
              color={theme.primary}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
