"use client";

import { Icon } from "@/components/rooms/shared/icons";
import { Badge, Switch, cx } from "@/components/rooms/shared/ui";
import { WAITER_MAX_ROW_OPTIONS } from "@/lib/rooms/constants";
import { spotWord } from "@/lib/rooms/format";
import {
  removeWaiter,
  setWaiterMax,
  toggleWaiterActive,
  waiterLoad,
} from "@/lib/rooms/rules";
import type { SpotLocation, Waiter } from "@/lib/rooms/types";
import { useOwner } from "./OwnerProvider";

/** The demo's `renderWaitersCard`: load bar, max, pause and remove. */
export function WaitersCard({ location, onAdd }: { location: SpotLocation; onAdd: () => void }) {
  const { state, save, toast, businessType } = useOwner();
  const tables = spotWord(businessType, true);

  const changeMax = (waiter: Waiter, value: number) => {
    const result = setWaiterMax(state, location.id, waiter.id, value);
    if (!result || !result.ok) return;
    save(result.state);
    toast(result.message);
  };

  const toggle = (waiter: Waiter) => {
    const result = toggleWaiterActive(state, location.id, waiter.id);
    if (!result || !result.ok) return;
    save(result.state);
    toast(result.message);
  };

  const remove = (waiter: Waiter) => {
    const result = removeWaiter(state, location.id, waiter.id);
    if (!result) return;
    if (!result.ok) {
      toast(result.error);
      return;
    }
    if (!window.confirm(`Remove ${waiter.name} from this location?`)) return;
    save(result.state);
    toast(`${result.name} removed.`);
  };

  return (
    <aside className="flex flex-col gap-3">
      <section
        className="rounded-card border border-black/10 bg-white shadow-soft"
        aria-labelledby="waiters-heading"
      >
        <div className="flex items-start justify-between gap-2.5 px-4 pt-3.5">
          <div>
            <p className="text-[13px] font-medium" id="waiters-heading">
              Waiters
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">
              How many {tables.toLowerCase()} each can handle.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-[29px] items-center gap-1 rounded-[7px] border border-ink/15 bg-white px-2 text-[11.5px] font-medium text-ink hover:bg-surface-muted"
            onClick={onAdd}
          >
            <Icon name="plus" size={13} /> Add
          </button>
        </div>

        <div className="mt-3 flex flex-col">
          {(location.waiters || []).map((waiter) => {
            const load = waiterLoad(state, location.id, waiter.id);
            const full = load >= waiter.maxTables;
            const label = !waiter.active ? "Paused" : full ? "At capacity" : "Available";
            const tone = !waiter.active ? "neutral" : full ? "amber" : "green";
            const percent = Math.min(100, Math.round((load / Math.max(1, waiter.maxTables)) * 100));
            return (
              <div
                key={waiter.id}
                className={cx(
                  "flex items-start gap-2.5 border-t border-black/5 px-4 py-3",
                  !waiter.active && "bg-neutral-50",
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-brand-navy text-[10.5px] font-medium text-white">
                  {waiter.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                    {waiter.name} <Badge tone={tone}>{label}</Badge>
                  </div>
                  <div className="mt-0.5 text-[10.5px] leading-[1.5] text-ink-muted">
                    {load} of {waiter.maxTables} {tables.toLowerCase()} today
                    {full
                      ? " · hidden at checkout"
                      : ` · ${waiter.maxTables - load} slot${waiter.maxTables - load === 1 ? "" : "s"} free`}
                  </div>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-pill bg-slate-100">
                    <span
                      className={cx(
                        "block h-full rounded-pill",
                        full ? "bg-brand-yellow" : "bg-brand-blue",
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <label className="flex items-center gap-1 text-[10.5px] text-ink-muted">
                    Max
                    <select
                      className="h-6 rounded-[6px] border border-ink/15 bg-white px-1 text-[11px] text-ink"
                      value={waiter.maxTables}
                      aria-label={`Maximum ${tables.toLowerCase()} for ${waiter.name}`}
                      onChange={(event) => changeMax(waiter, Number(event.target.value))}
                    >
                      {WAITER_MAX_ROW_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={waiter.active}
                      onChange={() => toggle(waiter)}
                      label={`Toggle ${waiter.name}`}
                      title={waiter.active ? "Pause this waiter" : "Make available again"}
                    />
                    <button
                      type="button"
                      className="grid h-6 w-6 place-items-center rounded-[6px] text-ink-muted hover:bg-surface-muted hover:text-red-700"
                      aria-label={`Remove ${waiter.name}`}
                      title="Remove waiter"
                      onClick={() => remove(waiter)}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex items-start gap-[9px] rounded-[9px] border border-brand-blue/[0.16] bg-brand-blue/[0.05] px-[11px] py-2.5 text-xs leading-[1.5] text-brand-navy">
        <Icon name="users" size={15} className="mt-px shrink-0" />
        <div>
          A waiter with <strong className="font-medium">3 open {tables.toLowerCase()} and a limit of 3</strong>{" "}
          disappears from the customer&apos;s waiter list — customers see them as “At capacity”.
          Closing a bill frees a slot immediately.
        </div>
      </div>
    </aside>
  );
}
