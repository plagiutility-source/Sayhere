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
import { mockSignIn, signInErrorMessage } from "@/lib/mock/auth";
import { EMAIL_FORMAT_MESSAGE, isValidEmail, MAX_EMAIL_LENGTH } from "@/lib/validation";

const linkClass =
  "rounded-control font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";

export default function LoginPage() {
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
      setPasswordError("Enter your password.");
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
    const result = await mockSignIn(email, password);
    if (!result.ok) {
      setFormError(signInErrorMessage(result.code));
      setSubmitting(false);
      return;
    }
    router.push("/onboarding");
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to open your dashboard."
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
        />

        <div className="-mt-sm text-right">
          <Link href="/forgot-password" className={`text-[13px] ${linkClass}`}>
            Forgot password?
          </Link>
        </div>

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
              Signing in…
            </>
          ) : (
            "Sign in"
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

      <p className="mt-2xl text-center text-[13px] text-ink-muted">
        New to Syehere?{" "}
        <Link href="/signup" className={linkClass}>
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
