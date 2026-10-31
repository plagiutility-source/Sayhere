"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/button";
import { FormMessage } from "@/components/form-message";
import { GoogleButton } from "@/components/google-button";
import { Input } from "@/components/input";
import { PasswordInput } from "@/components/password-input";
import { Spinner } from "@/components/spinner";
import { mockSignUp } from "@/lib/mock/auth";
import {
  EMAIL_FORMAT_MESSAGE,
  isValidEmail,
  MAX_EMAIL_LENGTH,
  MIN_PASSWORD_LENGTH,
  PASSWORD_LENGTH_MESSAGE,
} from "@/lib/validation";

const linkClass =
  "rounded-control font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    let valid = true;
    if (!email.trim()) {
      setEmailError("Enter your email address.");
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError(EMAIL_FORMAT_MESSAGE);
      valid = false;
    } else {
      setEmailError(undefined);
    }
    if (!password) {
      setPasswordError("Choose a password.");
      valid = false;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(PASSWORD_LENGTH_MESSAGE);
      valid = false;
    } else {
      setPasswordError(undefined);
    }
    return valid;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    if (!validate()) return;

    setSubmitting(true);
    const result = await mockSignUp(email, password);
    if (!result.ok) {
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <AuthCard
      title="Create your account"
      description="Two fields, then verify your email. Takes about 30 seconds."
    >
      <form className="grid gap-lg" onSubmit={handleSubmit} noValidate>
        {formError ? <FormMessage>{formError}</FormMessage> : null}

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

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
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
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <div className="my-xl flex items-center gap-md" aria-hidden="true">
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-[12px] uppercase tracking-[0.05em] text-ink-muted">
          or
        </span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <GoogleButton
        redirectTo="/onboarding"
        onFailure={setFormError}
        helperText="Your Google email is already verified."
      />

      <p className="mt-2xl text-[12px] leading-relaxed text-ink-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className={linkClass}>
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className={linkClass}>
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-lg text-center text-[13px] text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className={linkClass}>
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
