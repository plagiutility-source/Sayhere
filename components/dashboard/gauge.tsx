type GaugeProps = {
  /** 0..1 fraction. */
  value: number;
  /** Ring colour (the business primary from getBrandTheme). */
  color: string;
};

const SIZE = 88;
const STROKE = 9;

/**
 * Positive-rate ring gauge (PRD.md 5.2): 80–96px diameter, 8–10px stroke,
 * percentage centred in 15–16px medium. Labelled for screen readers.
 */
export function Gauge({ value, color }: GaugeProps) {
  const pct = Math.round(value * 100);
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div
      role="img"
      aria-label={`Positive rate: ${pct}%`}
      className="relative"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-medium tabular-nums text-ink">
        {pct}%
      </span>
    </div>
  );
}
