import { ArrowLeftIcon } from "./icons";

type BackButtonProps = {
  label: string;
  onBack: () => void;
  /** Business primary (icon fill). */
  color: string;
  /** Text/glyph colour on the primary (business onPrimary). */
  onPrimary: string;
};

/** 44 px back arrow + screen title (customer-page-ui-spec.md 1.4). */
export function BackButton({ label, onBack, color, onPrimary }: BackButtonProps) {
  return (
    <div className="flex items-center gap-sm">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        style={{ color: onPrimary, backgroundColor: color }}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon size={22} />
      </button>
      <h1 className="text-[19px] font-medium">{label}</h1>
    </div>
  );
}
