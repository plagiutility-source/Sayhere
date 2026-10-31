type AvatarProps = {
  /** Display name (email or business name); the initial is derived from it. */
  name: string;
  /** Rendered square size in px. Dashboard rows use 26px. */
  size?: number;
};

/** Initial-only avatar circle used by feedback rows. */
export function Avatar({ name, size = 26 }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-surface-muted font-medium text-ink"
    >
      {initial}
    </span>
  );
}
