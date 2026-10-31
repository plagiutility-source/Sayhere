/**
 * Loading skeletons (PRD.md 5.2). Each mirrors the exact dimensions of the
 * card it replaces so real data loading in causes zero layout shift.
 */

export function StatCardSkeleton() {
  return (
    <div className="flex min-h-[88px] flex-col justify-between rounded-card border border-black/10 bg-white p-5 shadow-soft">
      <div className="h-3 w-20 animate-pulse rounded bg-surface-muted" />
      <div className="mt-2 h-6 w-16 animate-pulse rounded bg-surface-muted" />
      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-surface-muted" />
    </div>
  );
}

/** Card-shaped skeleton with a title bar and a block of the given height. */
export function CardSkeleton({
  bodyHeight = 160,
  circle = false,
}: {
  bodyHeight?: number;
  circle?: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-card border border-black/10 bg-white p-lg shadow-soft">
      <div className="h-4 w-32 animate-pulse rounded bg-surface-muted" />
      {circle ? (
        <div className="mt-lg flex flex-1 items-center justify-center">
          <div className="h-[88px] w-[88px] animate-pulse rounded-full bg-surface-muted" />
        </div>
      ) : (
        <div
          className="mt-lg animate-pulse rounded bg-surface-muted"
          style={{ height: bodyHeight }}
        />
      )}
    </div>
  );
}

export function FeedbackListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-black/5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex h-12 items-center gap-3">
          <div className="h-[26px] w-[26px] shrink-0 animate-pulse rounded-full bg-surface-muted" />
          <div className="h-3 flex-1 animate-pulse rounded bg-surface-muted" />
          <div className="h-6 w-[92px] shrink-0 animate-pulse rounded-pill bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}

export function PlanWidgetSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-card border border-black/10 bg-white p-5 shadow-soft">
      <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
      <div className="mt-4 h-3 w-full animate-pulse rounded bg-surface-muted" />
      <div className="mt-2 h-2 w-full animate-pulse rounded-pill bg-surface-muted" />
      <div className="mt-4 h-3 w-40 animate-pulse rounded bg-surface-muted" />
      <div className="mt-auto pt-4">
        <div className="h-3 w-48 animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  );
}
