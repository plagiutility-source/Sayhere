import type { CSSProperties } from "react";

/**
 * Brief CSS-only confetti burst in green accents (brand-guide.md "Tone by
 * Moment"). The animation is disabled under `prefers-reduced-motion` in
 * `app/globals.css`. Client-only: it mounts after a user interaction, so the
 * positions never cause a hydration mismatch.
 */
export function Confetti() {
  const colors = ["#0E9F6E", "#34D399", "#A7F3D0", "#0B7A55"];
  const pieces = Array.from({ length: 14 }, (_, index) => {
    const style: CSSProperties = {
      left: `${(index * 7 + 4) % 96}%`,
      backgroundColor: colors[index % colors.length],
      animationDelay: `${(index % 5) * 40}ms`,
      transform: `rotate(${(index * 37) % 360}deg)`,
    };
    return <span key={index} className="cp-confetti-piece" style={style} />;
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces}
    </div>
  );
}
