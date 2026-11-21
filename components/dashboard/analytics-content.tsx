"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { getBrandTheme } from "@/lib/brand/theme";
import {
  interceptedTotalForRange,
  SCAN_RANGE_WINDOW,
  scanTotalForRange,
  type ScanRange,
} from "@/lib/dashboard/metrics";
import { getDashboardMock, MOCK_NOW } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";
import { useMockBusiness } from "@/lib/use-business";
import { AnalyticsCrmSection } from "./crm-cards";
import { ShareQrPlaceholder } from "./empty-state";
import { AnalyticsOrderingSection } from "./ordering-cards";
import { ActivityChart } from "./activity-chart";
import { SectionError } from "./section-error";
import { CardSkeleton, StatCardSkeleton } from "./skeletons";
import { StatCard } from "./stat-card";

function LoadingSections() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <CardSkeleton bodyHeight={160} />
        <CardSkeleton bodyHeight={160} />
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
  // Each metric's stat card and chart share one period.
  const [scanRange, setScanRange] = useState<ScanRange>("daily");
  const [feedbackRange, setFeedbackRange] = useState<ScanRange>("daily");
  const loading = mock.loading;
  const errored = mock.error && !recovered;
  const isEmpty = demo === "empty" || mock.scans.length === 0;

  const scanTotal = useMemo(
    () => scanTotalForRange(mock.scans, now, scanRange),
    [mock.scans, now, scanRange],
  );
  const interceptedTotal = useMemo(
    () => interceptedTotalForRange(mock.feedback, now, feedbackRange),
    [mock.feedback, now, feedbackRange],
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
          <div className="grid gap-3 lg:grid-cols-2">
            <Card title="Scans">
              <SectionError
                onRetry={() => setRecovered(true)}
                label="your scan activity"
              />
            </Card>
            <Card title="Feedback intercepted">
              <SectionError
                onRetry={() => setRecovered(true)}
                label="your intercepted feedback"
              />
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="Total scans"
              value={String(scanTotal)}
              delta={{ text: SCAN_RANGE_WINDOW[scanRange], direction: "none" }}
            />
            <StatCard
              label="Feedback intercepted"
              value={String(interceptedTotal)}
              delta={{
                text: SCAN_RANGE_WINDOW[feedbackRange],
                direction: "none",
              }}
            />
          </div>

          {isEmpty ? (
            <ShareQrPlaceholder />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              <ActivityChart
                scans={mock.scans}
                now={now}
                color={theme.primary}
                range={scanRange}
                onRangeChange={setScanRange}
              />
              <ActivityChart
                metric="intercepted"
                feedback={mock.feedback}
                now={now}
                color={theme.primary}
                range={feedbackRange}
                onRangeChange={setFeedbackRange}
              />
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
