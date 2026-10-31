import { FlameIcon } from "./icons";

/**
 * Engagement extra (PRD.md 5.1): "N-day streak with no negative reviews". The
 * caller hides it when there is no feedback.
 */
export function StreakBanner({ days, color }: { days: number; color: string }) {
  const label = days === 1 ? "1-day streak" : `${days}-day streak`;
  return (
    <div className="flex items-center gap-3 rounded-card border border-black/10 bg-white p-4 shadow-soft">
      <span style={{ color }} aria-hidden="true">
        <FlameIcon size={20} />
      </span>
      <p className="text-[13px] text-ink">
        <span className="font-medium">{label}</span> with no negative reviews
      </p>
    </div>
  );
}
