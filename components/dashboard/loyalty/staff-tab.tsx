"use client";

/**
 * Staff: people who can use Stamp mode. Each has a name and a PIN (4 to 6
 * digits, stored hashed). The PIN shows who gave each stamp and who confirmed
 * each reward. Turning a person off stops their PIN at once; their history
 * stays.
 */

import { useState } from "react";
import { addStaff, changePin } from "@/lib/loyalty/pin";
import { LOYALTY_LIMITS, setStaffActive, type LoyaltyState, type StaffMember } from "@/lib/loyalty/rules";
import { DEMO_STAFF_PIN, getLoyaltyState, setLoyaltyState } from "@/lib/mock/loyalty-store";
import { Field, Notice, Panel, btnPrimary, btnSecondary, formatDay, inputCls } from "./ui";

export function StaffTab({ state }: { state: LoyaltyState }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");

  async function add() {
    const res = await addStaff(getLoyaltyState(), { name, pin }, new Date());
    if (!res.ok) {
      setMessage({ kind: "error", text: res.message });
      return;
    }
    setLoyaltyState(res.state);
    setName("");
    setPin("");
    setMessage({ kind: "success", text: `${res.staff.name} was added.` });
  }

  async function savePin(staff: StaffMember) {
    const res = await changePin(getLoyaltyState(), staff.id, newPin);
    if (!res.ok) {
      setMessage({ kind: "error", text: res.message });
      return;
    }
    setLoyaltyState(res.state);
    setEditing(null);
    setNewPin("");
    setMessage({ kind: "success", text: `New PIN saved for ${staff.name}.` });
  }

  function toggle(staff: StaffMember) {
    setLoyaltyState(setStaffActive(getLoyaltyState(), staff.id, !staff.active));
    setMessage({
      kind: "success",
      text: staff.active ? `${staff.name} can no longer use Stamp mode.` : `${staff.name} can use Stamp mode again.`,
    });
  }

  const stampsBy = (id: string) => state.stamps.filter((s) => s.staff_id === id && !s.voided_at).length;

  return (
    <div className="grid gap-5">
      <Panel
        title="Staff"
        description="Each person gets their own PIN, so every stamp and reward has a name next to it."
      >
        {message ? (
          <div className="mb-3">
            <Notice kind={message.kind}>{message.text}</Notice>
          </div>
        ) : null}
        {state.staff.length === 0 ? (
          <p className="text-[13px] text-ink-muted">No staff yet. Add the first person below.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {state.staff.map((staff) => (
              <li key={staff.id} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink">
                      {staff.name}
                      <span
                        className={`ml-2 rounded-pill px-2 py-0.5 text-[11px] font-medium ${
                          staff.active
                            ? "bg-brand-green/10 text-brand-green-deep"
                            : "bg-surface-muted text-ink-muted"
                        }`}
                      >
                        {staff.active ? "Active" : "Off"}
                      </span>
                    </p>
                    <p className="text-[13px] text-ink-muted">
                      {stampsBy(staff.id)} stamps given · added {formatDay(staff.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => {
                        setEditing(editing === staff.id ? null : staff.id);
                        setNewPin("");
                      }}
                    >
                      Change PIN
                    </button>
                    <button type="button" className={btnSecondary} onClick={() => toggle(staff)}>
                      {staff.active ? "Turn off" : "Turn on"}
                    </button>
                  </div>
                </div>
                {editing === staff.id ? (
                  <form
                    className="mt-3 flex max-w-[360px] flex-wrap items-end gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void savePin(staff);
                    }}
                  >
                    <div className="min-w-[160px] flex-1">
                      <Field label="New PIN" htmlFor={`pin-${staff.id}`}>
                        <input
                          id={`pin-${staff.id}`}
                          type="password"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={LOYALTY_LIMITS.pinMax}
                          value={newPin}
                          onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ""))}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <button type="submit" className={btnPrimary} disabled={newPin.length < LOYALTY_LIMITS.pinMin}>
                      Save PIN
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Add staff" description={`Up to ${LOYALTY_LIMITS.maxStaff} people.`}>
        <form
          className="grid max-w-[360px] gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <Field label="Name" htmlFor="staff-name">
            <input
              id="staff-name"
              maxLength={LOYALTY_LIMITS.staffNameMax}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputCls}
            />
          </Field>
          <Field
            label="PIN"
            htmlFor="staff-pin"
            hint={`${LOYALTY_LIMITS.pinMin} to ${LOYALTY_LIMITS.pinMax} digits. Each person needs a different PIN.`}
          >
            <input
              id="staff-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={LOYALTY_LIMITS.pinMax}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              className={inputCls}
            />
          </Field>
          <button
            type="submit"
            className={`${btnPrimary} justify-self-start`}
            disabled={name.trim().length < LOYALTY_LIMITS.staffNameMin || pin.length < LOYALTY_LIMITS.pinMin}
          >
            Add staff
          </button>
        </form>
        <p className="mt-4 text-[12px] text-ink-muted">
          Demo mode: the first person, Counter, was created with PIN {DEMO_STAFF_PIN}. Change it
          before going live.
        </p>
      </Panel>
    </div>
  );
}
