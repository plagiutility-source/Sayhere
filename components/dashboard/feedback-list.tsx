import Link from "next/link";
import { timeAgo } from "@/lib/dashboard/metrics";
import { MOCK_NOW, type MockFeedback } from "@/lib/mock/dashboard";
import { Avatar } from "./avatar";
import { StatusPill, type FeedbackStatus } from "./status-pill";

/** Schema has no name column: show the email, else "Anonymous customer". */
export function feedbackDisplayName(row: MockFeedback): string {
  return row.customer_email ?? "Anonymous customer";
}

export function feedbackStatus(row: MockFeedback): FeedbackStatus {
  return row.sentiment === "positive" ? "positive" : "needs_reply";
}

function detailOf(row: MockFeedback): string {
  if (row.message) return row.message;
  return row.google_review_left === 1
    ? "Left a Google review"
    : "Shared happy feedback";
}

type FeedbackListProps = {
  rows: readonly MockFeedback[];
  /** Rows shown before "View all" (PRD.md 5.2: max 5 on the dashboard). */
  max?: number;
  viewAllHref?: string;
  showTime?: boolean;
};

/**
 * Avatar-initial rows (44–48px) with a one-line truncated detail and a
 * right-aligned status pill. Text renders as a plain React text node
 * (security section 4 — no dangerouslySetInnerHTML).
 */
export function FeedbackList({
  rows,
  max = 5,
  viewAllHref,
  showTime = false,
}: FeedbackListProps) {
  const visible = rows.slice(0, max);
  const hasMore = viewAllHref ? rows.length > visible.length : false;

  return (
    <div>
      <ul className="divide-y divide-black/5">
        {visible.map((row) => {
          const name = feedbackDisplayName(row);
          return (
            <li key={row.id} className="flex h-12 items-center gap-3">
              <Avatar name={name} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                <span className="font-medium">{name}</span>
                <span className="text-ink-muted"> · {detailOf(row)}</span>
              </span>
              {showTime ? (
                <span className="hidden shrink-0 text-[11px] text-ink-muted sm:inline">
                  {timeAgo(row.created_at, MOCK_NOW)}
                </span>
              ) : null}
              <StatusPill status={feedbackStatus(row)} />
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <div className="mt-3 border-t border-black/5 pt-3 text-right">
          <Link
            href={viewAllHref as string}
            className="text-[13px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
