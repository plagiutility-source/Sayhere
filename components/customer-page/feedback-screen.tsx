"use client";

import { useState, type FormEvent } from "react";
import type { BrandTheme } from "@/lib/brand/theme";
import { Spinner } from "@/components/spinner";
import { MAX_FEEDBACK_LENGTH, validateFeedback } from "@/lib/customer-page";
import { feedbackMessages, submitFeedback } from "@/lib/mock/review";
import { BackButton } from "./back-button";

const MESSAGE_ERROR = "Please enter 1 to 1000 characters.";

/** Prominent but neutral (no red/alarm) — brand-guide.md "Tone by Moment". */
const PROMINENT_BUTTON =
  "inline-flex min-h-[56px] w-full items-center justify-center gap-sm rounded-control bg-ink px-lg text-[17px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60";

type SubmitStatus = "idle" | "submitting" | "rate_limited" | "generic";

/**
 * Private feedback form (PRD 3.2, security section 3 / 4A). Reached from the
 * fair chooser, by happy and unhappy customers alike (owner request,
 * 2026-10-14), so the copy is neutral and never blames the customer.
 */
export function FeedbackScreen({
  theme,
  onSuccess,
  onBack,
}: {
  theme: BrandTheme;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [messageError, setMessageError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const submitting = status === "submitting";
  const overLimit = message.length > MAX_FEEDBACK_LENGTH;
  const statusMessage =
    status === "rate_limited"
      ? feedbackMessages.rateLimited
      : status === "generic"
        ? feedbackMessages.generic
        : undefined;

  function handleMessageChange(value: string) {
    setMessage(value);
    if (status !== "idle" && status !== "submitting") setStatus("idle");
    if (value.length > MAX_FEEDBACK_LENGTH) setMessageError(MESSAGE_ERROR);
    else if (messageError) setMessageError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateFeedback({ message, email });
    if (!validation.ok) {
      if (validation.field === "message") setMessageError(validation.message);
      else setEmailError(validation.message);
      return;
    }
    setMessageError(undefined);
    setEmailError(undefined);
    setStatus("submitting");

    const result = await submitFeedback({
      message: message.trim(),
      email: email.trim() || undefined,
      honeypot,
    });

    if (result.ok) {
      onSuccess();
      return;
    }
    setStatus(result.code);
  }

  return (
    <div>
      <BackButton
        label="Contact the owner"
        onBack={onBack}
        color={theme.primary}
        onPrimary={theme.onPrimary}
      />
      <h2 className="mt-2xl font-display text-[20px] font-medium leading-tight">
        What&apos;s on your mind?
      </h2>
      <p className="mt-sm text-[14px] leading-relaxed text-ink-muted">
        Your message goes straight to the owner and our team, privately — we
        read every one.
      </p>
      <p
        className="mt-md rounded-control border border-black/10 bg-white/70 px-md py-sm text-[13px] leading-relaxed text-ink"
      >
        We appreciate you taking the time to help us improve — suggestions from
        customers like you shape what we do next.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-lg grid gap-lg">
        <div>
          <label htmlFor="fb-message" className="block text-[13px] font-medium">
            Your message
          </label>
          <textarea
            id="fb-message"
            value={message}
            onChange={(event) => handleMessageChange(event.target.value)}
            rows={5}
            aria-invalid={messageError ? true : undefined}
            aria-describedby={messageError ? "fb-message-error" : undefined}
            className={`mt-sm w-full rounded-control border bg-white px-md py-sm text-[16px] leading-relaxed text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
              messageError ? "border-ink" : "border-black/20"
            }`}
          />
          <div className="mt-xs flex items-center justify-between text-[12px]">
            <span
              id="fb-message-error"
              className="text-ink"
              role={messageError ? "alert" : undefined}
            >
              {messageError ?? ""}
            </span>
            <span
              className={`tabular-nums ${overLimit ? "font-medium text-ink" : "text-ink-muted"}`}
            >
              {message.length} / {MAX_FEEDBACK_LENGTH}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="fb-email" className="block text-[13px] font-medium">
            Email <span className="text-ink-muted">(optional)</span>
          </label>
          <input
            id="fb-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError(undefined);
            }}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "fb-email-error" : undefined}
            className={`mt-sm h-11 w-full rounded-control border bg-white px-md text-[16px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
              emailError ? "border-ink" : "border-black/20"
            }`}
          />
          {emailError ? (
            <p id="fb-email-error" role="alert" className="mt-xs text-[12px] text-ink">
              {emailError}
            </p>
          ) : null}
        </div>

        {/* Honeypot: hidden, not focusable, ignored by humans (security section 3). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor="fb-company">Company</label>
          <input
            id="fb-company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </div>

        {/* TODO(stage 5): load Cloudflare Turnstile here and verify the token
            server-side before accepting the submission. Nothing loads in Stage 1. */}
        <p className="rounded-control border border-dashed border-black/15 px-md py-sm text-center text-[12px] text-ink-muted">
          Bot check placeholder — wired in a later stage.
        </p>

        {statusMessage ? (
          <p
            role="status"
            className="rounded-control border border-black/10 bg-white/70 px-md py-sm text-[13px] text-ink"
          >
            {statusMessage}
          </p>
        ) : null}

        <button type="submit" disabled={submitting} className={PROMINENT_BUTTON}>
          {submitting ? (
            <>
              <Spinner />
              Sending…
            </>
          ) : (
            "Send to owner"
          )}
        </button>
      </form>
    </div>
  );
}
