"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/button";
import { FormMessage } from "@/components/form-message";
import { Spinner } from "@/components/spinner";
import {
  authMessages,
  mockCheckEmailVerified,
  mockResendVerificationEmail,
} from "@/lib/mock/auth";

const linkClass =
  "rounded-control font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";

/** Seconds the Resend button stays locked after one send (mirrors the email rate limit). */
const RESEND_COOLDOWN_SECONDS = 30;

type StatusMessage = { variant: "error" | "info"; text: string };

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<StatusMessage>();

  // One timeout per remaining second; cleared on unmount and on each tick.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setMessage(undefined);
    await mockResendVerificationEmail(email);
    setResending(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    // Generic on purpose: identical whether or not the email exists.
    setMessage({ variant: "info", text: authMessages.verificationSent });
  }

  async function handleVerified() {
    setChecking(true);
    setMessage(undefined);
    const result = await mockCheckEmailVerified(email);
    setChecking(false);
    if (result.ok) {
      router.push("/onboarding");
      return;
    }
    setMessage({ variant: "error", text: authMessages.notVerified });
  }

  return (
    <AuthCard
      title="Check your inbox"
      description="We sent a verification link to:"
    >
      <p className="break-words rounded-control border border-black/10 bg-surface-muted px-md py-sm text-[14px] font-medium">
        {email || "your email address"}
      </p>

      <p className="mt-lg text-[13px] leading-relaxed text-ink-muted">
        Open the link in that email to verify your address. You must verify it
        before you can finish setting up your business.
      </p>

      {message ? (
        <div className="mt-lg">
          <FormMessage variant={message.variant}>{message.text}</FormMessage>
        </div>
      ) : null}

      <div className="mt-2xl grid gap-md">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={handleVerified}
          disabled={checking || resending}
          aria-busy={checking}
        >
          {checking ? (
            <>
              <Spinner />
              Checking…
            </>
          ) : (
            "I've verified my email"
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          aria-busy={resending}
        >
          {resending
            ? "Sending…"
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend email"}
        </Button>
      </div>

      <p className="mt-2xl text-center text-[13px] text-ink-muted">
        Wrong address?{" "}
        <Link href="/signup" className={linkClass}>
          Use a different email
        </Link>
      </p>
    </AuthCard>
  );
}
