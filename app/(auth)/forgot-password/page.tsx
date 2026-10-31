"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/button";
import { FormMessage } from "@/components/form-message";
import { Input } from "@/components/input";
import { Spinner } from "@/components/spinner";
import { authMessages, mockRequestPasswordReset } from "@/lib/mock/auth";
import {
  EMAIL_FORMAT_MESSAGE,
  isValidEmail,
  MAX_EMAIL_LENGTH,
} from "@/lib/validation";

const linkClass =
  "rounded-control font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [result, setResult] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(undefined);

    if (!email.trim()) {
      setEmailError("Enter your email address.");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError(EMAIL_FORMAT_MESSAGE);
      return;
    }
    setEmailError(undefined);

    setSubmitting(true);
    await mockRequestPasswordReset(email);
    // Always the same sentence, whether or not the email exists
    // (security-and-reliability.md section 1).
    setResult(authMessages.resetSent);
    setSubmitting(false);
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we will send a reset link."
    >
      <form className="grid gap-lg" onSubmit={handleSubmit} noValidate>
        {result ? <FormMessage variant="info">{result}</FormMessage> : null}

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          maxLength={MAX_EMAIL_LENGTH}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
          placeholder="you@example.com"
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <Spinner />
              Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <p className="mt-2xl text-center text-[13px] text-ink-muted">
        Remembered it?{" "}
        <Link href="/login" className={linkClass}>
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
