"use client";

import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { loyaltyStats, type LoyaltyState } from "@/lib/loyalty/rules";
import { useBusiness } from "@/lib/use-business";
import type { DemoScenario } from "@/lib/mock/demo";
import { useNow } from "@/lib/use-loyalty";
import { Panel } from "./ui";

const none = { text: "", direction: "none" } as const;

export function OverviewTab({ state, demo }: { state: LoyaltyState; demo: DemoScenario }) {
  const now = useNow(60_000) ?? new Date(0);
  const business = useBusiness();
  const stats = loyaltyStats(state, now);
  const activeOffers = state.offers.filter((o) => o.active).length;
  const activeStaff = state.staff.filter((s) => s.active).length;

  const steps = [
    {
      done: state.program.enabled,
      text: "Turn the program on",
      href: `/loyalty?demo=${demo}&tab=settings`,
    },
    {
      done: activeOffers > 0,
      text: "Add at least one reward customers can choose",
      href: `/loyalty?demo=${demo}&tab=rewards`,
    },
    {
      done: activeStaff > 0,
      text: "Add a staff PIN for Stamp mode",
      href: `/loyalty?demo=${demo}&tab=staff`,
    },
  ];
  const ready = steps.every((s) => s.done);

  return (
    <div className="grid gap-5">
      {!ready ? (
        <Panel
          title="Finish setting up"
          description="Customers see the Loyalty card button once the program is on."
        >
          <ul className="grid gap-2">
            {steps.map((step) => (
              <li key={step.text} className="flex items-center gap-3 text-[13px]">
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    step.done ? "bg-brand-green text-white" : "border border-black/20"
                  }`}
                >
                  {step.done ? "✓" : ""}
                </span>
                {step.done ? (
                  <span className="text-ink-muted line-through">{step.text}</span>
                ) : (
                  <Link href={step.href} className="font-medium text-brand-blue hover:underline">
                    {step.text}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Members" value={String(stats.members)} delta={{ ...none, text: `${stats.newThisWeek} new this week` }} />
        <StatCard label="Stamps given" value={String(stats.stampsTotal)} delta={{ ...none, text: `${stats.stampsThisWeek} this week` }} />
        <StatCard label="Rewards chosen" value={String(stats.rewardsChosen)} delta={{ ...none, text: `${stats.rewardsOpen} waiting to be used` }} />
        <StatCard label="Rewards used" value={String(stats.rewardsRedeemed)} delta={{ ...none, text: `${stats.rewardsExpired} expired` }} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Rewards" description="How often each reward is chosen and used.">
          {stats.perOffer.length === 0 ? (
            <p className="text-[13px] text-ink-muted">No rewards yet.</p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="text-ink-muted">
                <tr>
                  <th className="pb-2 font-normal">Reward</th>
                  <th className="pb-2 text-right font-normal">Chosen</th>
                  <th className="pb-2 text-right font-normal">Used</th>
                </tr>
              </thead>
              <tbody>
                {stats.perOffer.map((row) => (
                  <tr key={row.offerId} className="border-t border-black/5">
                    <td className="py-2 pr-2">{row.title}</td>
                    <td className="py-2 text-right tabular-nums">{row.chosen}</td>
                    <td className="py-2 text-right tabular-nums">{row.redeemed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Staff" description="Who gave stamps and confirmed rewards.">
          {stats.perStaff.length === 0 ? (
            <p className="text-[13px] text-ink-muted">No staff yet.</p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="text-ink-muted">
                <tr>
                  <th className="pb-2 font-normal">Name</th>
                  <th className="pb-2 text-right font-normal">Stamps</th>
                  <th className="pb-2 text-right font-normal">Rewards</th>
                </tr>
              </thead>
              <tbody>
                {stats.perStaff.map((row) => (
                  <tr key={row.staffId} className="border-t border-black/5">
                    <td className="py-2 pr-2">{row.name}</td>
                    <td className="py-2 text-right tabular-nums">{row.stamps}</td>
                    <td className="py-2 text-right tabular-nums">{row.redemptions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-[12px] text-ink-muted">
            Stamps a customer enters from the counter code are not tied to one
            staff member, so they are not counted here.
          </p>
        </Panel>
      </div>

      <Panel
        title="Try it on this device"
        description="Demo mode: everything is saved in this browser only."
      >
        <ol className="list-decimal space-y-1 pl-5 text-[13px] text-ink-muted">
          <li>
            Open{" "}
            <a
              href={`/r/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-blue hover:underline"
            >
              your customer page
            </a>{" "}
            and tap Loyalty card. Join with any email; the code is shown on screen.
          </li>
          <li>
            Tap Get a stamp. Then open the Stamp mode tab, unlock it with PIN
            1234 and enter the code the customer sees.
          </li>
          <li>
            Repeat until the card is full. In demo mode you can set the gap
            between stamps to 0 in Settings so you do not have to wait.
          </li>
          <li>Choose a reward on the customer page, then redeem its code in Stamp mode.</li>
        </ol>
      </Panel>
    </div>
  );
}
