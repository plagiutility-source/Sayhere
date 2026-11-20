"use client";

import Link from "next/link";
import { Card } from "@/components/card";
import { timeAgo } from "@/lib/dashboard/metrics";
import { MOCK_NOW, type MockFeedback } from "@/lib/mock/dashboard";
import { withDemo, type DemoScenario } from "@/lib/mock/demo";
import { Avatar } from "./avatar";
import { feedbackDisplayName } from "./feedback-list";
import { SectionError } from "./section-error";

const INBOX_PREVIEW = 4;

/**
 * The manager's private inbox on the dashboard: messages customers sent from
 * the customer page (the "contact the owner" form) rather than posting a public
 * review. Each row shows the suggestion, when it arrived and whether it still
 * needs a reply.
 */
export function ManagerInbox({
  feedback,
  demo,
  errored = false,
  onRetry,
  className = "",
}: {
  feedback: readonly MockFeedback[];
  demo: DemoScenario;
  errored?: boolean;
  onRetry?: () => void;
  className?: string;
}) {
  // Never include customers who posted on Google — the inbox is only what was
  // sent privately to the owner/manager.
  const messages = feedback.filter(
    (row) => row.google_review_left === 0 && Boolean(row.message),
  );
  const pending = messages.filter((row) => row.owner_replied === 0).length;
  const rows = messages.slice(0, INBOX_PREVIEW);

  return (
    <Card
      title="Manager inbox"
      description="Private suggestions customers sent from your customer page — only you can see them."
      className={className}
    >
      {errored ? (
        <SectionError
          onRetry={onRetry ?? (() => {})}
          label="your inbox"
        />
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <p className="text-[13px] font-medium text-ink">
            No private messages yet
          </p>
          <p className="max-w-sm text-[13px] text-ink-muted">
            When a customer writes to you privately from your customer page, it
            lands here.
          </p>
        </div>
      ) : (
        <>
          <p className="text-[12px] text-ink-muted">
            {pending === 0
              ? "Everything has been replied to."
              : `${pending} waiting for a reply.`}
          </p>
          <ul className="mt-1 divide-y divide-black/5">
            {rows.map((row) => {
              const replied = row.owner_replied === 1;
              return (
                <li key={row.id} className="py-3 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Avatar name={feedbackDisplayName(row)} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                      {feedbackDisplayName(row)}
                    </span>
                    <span className="shrink-0 text-[11px] text-ink-muted">
                      {timeAgo(row.created_at, MOCK_NOW)}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center justify-center rounded-pill px-2 py-1 text-[11px] font-medium ${
                        replied
                          ? "bg-surface-muted text-ink-muted"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {replied ? "Replied" : "New"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 pl-[34px] text-[13px] text-ink-muted">
                    {row.message}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 border-t border-black/5 pt-3 text-right">
            <Link
              href={withDemo("/feedback", demo)}
              className="text-[13px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Open inbox
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}
