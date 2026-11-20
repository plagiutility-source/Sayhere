"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { getBrandTheme } from "@/lib/brand/theme";
import {
  feedbackIntercepted,
  formatPercent,
  formatPointsDelta,
  interceptedWeekOverWeek,
  positiveCount,
  positiveRate,
  positiveRateWeekOverWeek,
  SCAN_RANGE_WINDOW,
  scanTotalForRange,
  type ScanRange,
} from "@/lib/dashboard/metrics";
import { getDashboardMock, MOCK_NOW } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";
import { useMockBusiness } from "@/lib/use-business";
import { AnalyticsCrmSection } from "./crm-cards";
import { ShareQrPlaceholder } from "./empty-state";
import { Gauge } from "./gauge";
import { AnalyticsOrderingSection } from "./ordering-cards";
import { ScanActivity } from "./scan-activity";
import { SectionError } from "./section-error";
import { CardSkeleton, StatCardSkeleton } from "./skeletons";
import { StatCard } from "./stat-card";

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
    </>
  );
}

export function AnalyticsContent({ demo }: { demo: DemoScenario }) {
  const mock = useMemo(() => getDashboardMock(demo), [demo]);
  // MOCK ONLY, removed in Stage 4: colours come from the shared profile.
  const business = useMockBusiness(mock.business, demo !== "long-name");
  const theme = useMemo(() => getBrandTheme(business), [business]);
  const now = MOCK_NOW;

  const [recovered, setRecovered] = useState(false);
  // One period shared by the total-scans stat and the scan chart.
  const [scanRange, setScanRange] = useState<ScanRange>("daily");
  const loading = mock.loading;
  const errored = mock.error && !recovered;
  const isEmpty = demo === "empty" || mock.scans.length === 0;

  const rate = positiveRate(mock.feedback);
  const scanTotal = useMemo(
    () => scanTotalForRange(mock.scans, now, scanRange),
    [mock.scans, now, scanRange],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">
          Analytics
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          How your reviews and scans are trending.
        </p>
      </header>

      {loading ? (
        <LoadingSections />
      ) : errored ? (
        <>
          <Card title="Overview">
            <SectionError onRetry={() => setRecovered(true)} label="your metrics" />
          </Card>
          <div className="grid gap-3 lg:grid-cols-5">
            <Card title="Scans" className="h-full lg:col-span-3">
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
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total scans"
              value={String(scanTotal)}
              delta={{ text: SCAN_RANGE_WINDOW[scanRange], direction: "none" }}
            />
            <StatCard
              label="Feedback intercepted"
              value={String(feedbackIntercepted(mock.feedback))}
              week={interceptedWeekOverWeek(mock.feedback, now)}
            />
            <StatCard
              label="% positive"
              value={formatPercent(rate)}
              delta={formatPointsDelta(positiveRateWeekOverWeek(mock.feedback, now))}
            />
          </div>

          {isEmpty ? (
            <ShareQrPlaceholder />
          ) : (
            <div className="grid gap-3 lg:grid-cols-5">
              <ScanActivity
                scans={mock.scans}
                now={now}
                color={theme.primary}
                range={scanRange}
                onRangeChange={setScanRange}
                className="h-full lg:col-span-3"
              />
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
        </>
      )}

      {/* Merge M9: table/room ordering analytics, below the review content. */}
      <AnalyticsOrderingSection planId={mock.plan.id} />

      {/* CRM analytics (salon/gym/retail/other on Starter+). */}
      <AnalyticsCrmSection planId={mock.plan.id} />
    </div>
  );
}
