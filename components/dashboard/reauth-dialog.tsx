"use client";

/**
 * The mock "Confirm it's you" re-authentication dialog
 * (security-and-reliability.md section 1: cancel subscription, change email,
 * change password, delete account and disconnect Google require the owner to
 * have authenticated in the last 10 minutes).
 *
 * UI ONLY, frontend-only Stage 1: there is no backend and no Firebase here.
 * The check compares against the one mock password in `lib/mock/auth.ts`; any
 * other password fails with the same generic message (security 5A — never say
 * whether the password or the account was wrong). Stage 3 replaces the compare
 * with Firebase `reauthenticateWithCredential`.
 */

import { useEffect, useState } from "react";
import { Input } from "@/components/input";
import { authMessages, MOCK_SIGN_IN_ACCOUNT } from "@/lib/mock/auth";
import { Modal } from "./modal";

export function ReauthDialog({
  open,
  description,
  confirmLabel = "Continue",
  onClose,
  onConfirm,
}: {
  open: boolean;
  /** One plain sentence naming the action being confirmed. */
  description: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset on every open so a failed attempt never carries over.
  useEffect(() => {
    if (open) {
      setPassword("");
      setError(null);
    }
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password === MOCK_SIGN_IN_ACCOUNT.password) {
      setPassword("");
      setError(null);
      onConfirm();
      return;
    }
    setError(authMessages.wrongCredentials);
  }

  return (
    <Modal
      open={open}
      title="Confirm it's you"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="reauth-form"
            className="inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <form id="reauth-form" onSubmit={handleSubmit}>
        <p className="text-[13px] text-ink">{description}</p>
        <div className="mt-3">
          <Input
            label="Your password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={error ?? undefined}
            hint={`Demo only: the mock password is “${MOCK_SIGN_IN_ACCOUNT.password}”.`}
          />
        </div>
      </form>
    </Modal>
  );
}
