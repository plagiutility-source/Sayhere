"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { getBrandTheme } from "@/lib/brand/theme";
import {
  busiestDaySummary,
  dailyScanBuckets,
  feedbackIntercepted,
  formatPercent,
  formatPointsDelta,
  interceptedWeekOverWeek,
  positiveCount,
  positiveRate,
  positiveRateWeekOverWeek,
  scanSourceCounts,
  scanWeekOverWeek,
  totalScans,
} from "@/lib/dashboard/metrics";
import { getDashboardMock, MOCK_NOW } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";
import { useMockBusiness } from "@/lib/use-business";
import { BarChart } from "./bar-chart";
import { AnalyticsCrmSection } from "./crm-cards";
import { ShareQrPlaceholder } from "./empty-state";
import { Gauge } from "./gauge";
import { AnalyticsOrderingSection } from "./ordering-cards";
import { SectionError } from "./section-error";
import { CardSkeleton, StatCardSkeleton } from "./skeletons";
import { StatCard } from "./stat-card";

/** Scan source split (qr / nfc / link) — a labelled segmented bar + legend. */
function ScanSourceSplit({
  counts,
  color,
}: {
  counts: { qr: number; nfc: number; link: number; total: number };
  color: string;
}) {
  const pct = (n: number) => (counts.total > 0 ? (n / counts.total) * 100 : 0);
  const rows: { key: string; label: string; value: number; opacity: string }[] = [
    { key: "qr", label: "QR", value: counts.qr, opacity: "FF" },
    { key: "nfc", label: "NFC", value: counts.nfc, opacity: "B3" },
    { key: "link", label: "Link", value: counts.link, opacity: "66" },
  ];

  return (
    <div className="mt-4">
      <p className="text-[12px] text-ink-muted">Scan source</p>
      <div
        className="mt-2 flex h-2 overflow-hidden rounded-pill bg-surface-muted"
        aria-hidden="true"
      >
        {rows.map((row) => (
          <div
            key={row.key}
            style={{
              width: `${pct(row.value)}%`,
              backgroundColor: `${color}${row.opacity}`,
            }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-4">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2 text-[12px]">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: `${color}${row.opacity}` }}
            />
            <span className="text-ink-muted">{row.label}</span>
            <span className="tabular-nums text-ink">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
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
  const loading = mock.loading;
  const errored = mock.error && !recovered;
  const isEmpty = demo === "empty" || mock.scans.length === 0;

  const buckets = useMemo(
    () => dailyScanBuckets(mock.scans, now),
    [mock.scans, now],
  );
  const summary = busiestDaySummary(buckets);
  const sources = useMemo(() => scanSourceCounts(mock.scans), [mock.scans]);
  const rate = positiveRate(mock.feedback);

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
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Scan count"
              value={String(totalScans(mock.scans))}
              week={scanWeekOverWeek(mock.scans, now)}
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
              <Card title="Weekly scan activity" className="h-full lg:col-span-3">
                <BarChart buckets={buckets} color={theme.primary} summary={summary} />
                <ScanSourceSplit counts={sources} color={theme.primary} />
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
        </>
      )}

      {/* Merge M9: table/room ordering analytics, below the review content. */}
      <AnalyticsOrderingSection />

      {/* CRM analytics (salon/gym/retail/other on Starter+). */}
      <AnalyticsCrmSection planId={mock.plan.id} />
    </div>
  );
}
