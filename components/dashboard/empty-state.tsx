/** Light placeholder shown instead of the chart/gauge when there is no data. */
export function ShareQrPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-black/15 bg-surface-muted px-6 py-12 text-center">
      <p className="text-[13px] font-medium text-ink">No scans yet</p>
      <p className="max-w-sm text-[13px] text-ink-muted">
        Share your QR code so customers can scan it. Scans and feedback will
        appear here once people start using it.
      </p>
    </div>
  );
}

/** Empty text for the recent feedback card. */
export function EmptyFeedback() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <p className="text-[13px] font-medium text-ink">No feedback yet</p>
      <p className="max-w-sm text-[13px] text-ink-muted">
        Share your QR code to start collecting feedback from customers.
      </p>
    </div>
  );
}
