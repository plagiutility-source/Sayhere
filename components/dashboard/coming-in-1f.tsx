import { PageIcon } from "./icons";

/**
 * Minimal placeholder for the screens that belong to step 1F, so no sidebar
 * link 404s. Real pages are built in 1F.
 */
export function ComingIn1F({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-[20px] font-medium leading-[1.3] text-ink">{title}</h1>
      <div className="mt-6 flex flex-col items-center rounded-card border border-dashed border-black/15 bg-surface-muted px-6 py-16 text-center">
        <span className="text-ink-muted">
          <PageIcon size={40} />
        </span>
        <p className="mt-4 text-[13px] text-ink-muted">
          This screen is built in step 1F.
        </p>
      </div>
    </div>
  );
}
