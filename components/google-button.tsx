"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/spinner";
import { mockSignInWithGoogle } from "@/lib/mock/auth";

type GoogleButtonProps = {
  /** Where to go once the mock Google sign-in "succeeds". */
  redirectTo: string;
  /** Label under the button; Google users have a verified email already. */
  helperText?: string;
  onFailure?: (message: string) => void;
};

/**
 * MOCK ONLY, remove in Stage 3: this simulates a Firebase Google popup.
 * It never opens a real OAuth window and receives no credentials.
 */
export function GoogleButton({
  redirectTo,
  helperText,
  onFailure,
}: GoogleButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await mockSignInWithGoogle();
    if (!result.ok) {
      setPending(false);
      onFailure?.("Something went wrong. Please try again.");
      return;
    }
    router.push(redirectTo);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-sm rounded-control border border-ink bg-white px-lg text-[15px] font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Spinner />
            Connecting…
          </>
        ) : (
          <>
            {/* Google "G" mark, inline so no extra request or package is needed. */}
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="#4285F4"
                d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.88h3.72c2.18-2 3.44-4.96 3.44-8.54Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.88c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.75H1.7v2.98A11.99 11.99 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.55 14.68a7.2 7.2 0 0 1 0-4.6V7.1H1.7a12 12 0 0 0 0 10.56l3.85-2.98Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.69 0 3.2.58 4.4 1.72l3.3-3.3A11.98 11.98 0 0 0 12 0 11.99 11.99 0 0 0 1.7 7.1l3.85 2.98C6.46 7.35 9 4.75 12 4.75Z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </button>
      {helperText ? (
        <p className="mt-xs text-[12px] text-ink-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
