import { CATEGORY_LABELS, type BusinessCategory } from "@/lib/category/types";

type CategoryLockBadgeProps = {
  category: BusinessCategory;
  /** `sm` for inline rows, `md` for Settings and the completion screen. */
  size?: "sm" | "md";
  className?: string;
};

/**
 * The lock icon plus the category name. Used read-only in Settings, Locations,
 * the onboarding completion screen and the dashboard top bar tooltip. There is
 * no click handler: the category can never be changed from here.
 */
export function CategoryLockBadge({
  category,
  size = "sm",
  className = "",
}: CategoryLockBadgeProps) {
  const text = size === "md" ? "text-[14px]" : "text-[12px]";
  const icon = size === "md" ? 16 : 13;
  return (
    <span
      className={`inline-flex items-center gap-xs rounded-pill border border-black/15 bg-surface-muted px-sm py-xs font-medium text-ink ${text} ${className}`}
    >
      <svg
        aria-hidden="true"
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
        <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
      </svg>
      {CATEGORY_LABELS[category]}
      <span className="sr-only"> — category locked</span>
    </span>
  );
}
