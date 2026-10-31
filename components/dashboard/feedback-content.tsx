"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import { timeAgo } from "@/lib/dashboard/metrics";
import { getDashboardMock, MOCK_NOW, type MockFeedback } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";
import { Avatar } from "./avatar";
import { EmptyFeedback } from "./empty-state";
import { feedbackDisplayName } from "./feedback-list";
import { ChevronDownIcon, CheckIcon } from "./icons";
import { SectionError } from "./section-error";
import { FeedbackListSkeleton } from "./skeletons";
import { StatusPill, type FeedbackStatus } from "./status-pill";
import { useDashboardSearch } from "./shell";

/**
 * The docs do not specify a page size, so it is a single constant here and
 * logged as an open question in PROGRESS.md.
 */
const FEEDBACK_PAGE_SIZE = 10;

type FilterId = "all" | "positive" | "needs_reply";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "positive", label: "Positive" },
  { id: "needs_reply", label: "Needs reply" },
];

function previewOf(row: MockFeedback): string {
  if (row.message) return row.message;
  return row.google_review_left === 1
    ? "Left a Google review"
    : "Shared happy feedback";
}

function statusOf(row: MockFeedback, replied: boolean): FeedbackStatus {
  if (row.sentiment === "positive") return "positive";
  return replied ? "negative" : "needs_reply";
}

function FeedbackRow({
  row,
  replied,
  expanded,
  onToggle,
  onMarkReplied,
}: {
  row: MockFeedback;
  replied: boolean;
  expanded: boolean;
  onToggle: () => void;
  onMarkReplied: () => void;
}) {
  const name = feedbackDisplayName(row);
  const detailId = `feedback-detail-${row.id}`;

  return (
    <li className="py-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={detailId}
        className="flex w-full items-center gap-3 rounded-control px-1 py-2 text-left hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        <Avatar name={name} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-[13px] font-medium text-ink">
              {name}
            </span>
            <span className="ml-auto shrink-0 text-[11px] text-ink-muted">
              {timeAgo(row.created_at, MOCK_NOW)}
            </span>
          </span>
          <span className="truncate text-[13px] text-ink-muted">
            {previewOf(row)}
          </span>
        </span>
        <StatusPill status={statusOf(row, replied)} />
        <span
          aria-hidden="true"
          className={`shrink-0 text-ink-muted transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <ChevronDownIcon size={16} />
        </span>
      </button>

      {expanded ? (
        <div
          id={detailId}
          className="ml-[38px] mr-1 mb-2 rounded-card border border-black/10 bg-surface-muted p-4"
        >
          {/* Plain text only (security 4): React escapes it. */}
          <p className="whitespace-pre-wrap break-words text-[13px] text-ink">
            {row.message ??
              (row.google_review_left === 1
                ? "This customer left a Google review."
                : "This customer shared happy feedback.")}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {row.customer_email ? (
              <a
                href={`mailto:${row.customer_email}`}
                className="text-[13px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                {row.customer_email}
              </a>
            ) : (
              <span className="text-[13px] text-ink-muted">
                No email provided
              </span>
            )}

            {replied ? (
              <span className="ml-auto inline-flex items-center gap-1 text-[13px] text-ink-muted">
                <CheckIcon size={16} />
                Marked as replied
              </span>
            ) : (
              <button
                type="button"
                onClick={onMarkReplied}
                className="ml-auto inline-flex h-9 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              >
                Mark as replied
              </button>
            )}
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function FeedbackContent({ demo }: { demo: DemoScenario }) {
  const mock = useMemo(() => getDashboardMock(demo), [demo]);
  const { query } = useDashboardSearch();

  const [filter, setFilter] = useState<FilterId>("all");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [recovered, setRecovered] = useState(false);

  const loading = mock.loading;
  const errored = mock.error && !recovered;
  const isEmpty = demo === "empty" || mock.feedback.length === 0;

  // Reset to the first page whenever the filter or search changes.
  useEffect(() => {
    setPage(1);
  }, [filter, query]);

  const isReplied = (row: MockFeedback) =>
    row.owner_replied === 1 || marked.has(row.id);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mock.feedback;
    return mock.feedback.filter((row) =>
      (row.message ?? "").toLowerCase().includes(q),
    );
  }, [mock.feedback, query]);

  const filtered = useMemo(() => {
    return searched.filter((row) => {
      if (filter === "all") return true;
      if (filter === "positive") return row.sentiment === "positive";
      return row.sentiment === "negative" && !isReplied(row);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, filter, marked]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / FEEDBACK_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * FEEDBACK_PAGE_SIZE,
    safePage * FEEDBACK_PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">
          Feedback
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Everything customers told you, newest first.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter feedback">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(item.id)}
              className={`inline-flex h-9 items-center rounded-pill border px-3 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                active
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "border-black/15 bg-white text-ink hover:bg-surface-muted"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <Card>
        {loading ? (
          <FeedbackListSkeleton rows={6} />
        ) : errored ? (
          <SectionError onRetry={() => setRecovered(true)} label="feedback" />
        ) : isEmpty ? (
          <EmptyFeedback />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-[13px] font-medium text-ink">
              No feedback matches your search.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter("all");
              }}
              className="text-[13px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-black/5">
              {pageRows.map((row) => (
                <FeedbackRow
                  key={row.id}
                  row={row}
                  replied={isReplied(row)}
                  expanded={expandedId === row.id}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === row.id ? null : row.id,
                    )
                  }
                  onMarkReplied={() =>
                    setMarked((current) => {
                      const next = new Set(current);
                      next.add(row.id);
                      return next;
                    })
                  }
                />
              ))}
            </ul>

            {totalPages > 1 ? (
              <nav
                aria-label="Feedback pagination"
                className="mt-4 flex items-center justify-between border-t border-black/5 pt-4"
              >
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="inline-flex h-9 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] text-ink disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  Previous
                </button>
                <span className="text-[12px] text-ink-muted">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="inline-flex h-9 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] text-ink disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  Next
                </button>
              </nav>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
