"use client";

import { site } from "@/lib/mock/site";

/**
 * Root error boundary (security-and-reliability.md 5A item 7). This one
 * replaces the root layout, so it renders its own <html>/<body> and uses inline
 * styles instead of the Tailwind classes.
 *
 * MUST NOT render `error.message`, `error.stack` or any provider text: only the
 * friendly wording and Next's short `digest`. Nothing is logged to the browser
 * console (5A item 11).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#1F2937",
          fontFamily:
            "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "440px", textAlign: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              lineHeight: 1.25,
              fontWeight: 500,
            }}
          >
            Something went wrong on our side.
          </h1>
          <p
            style={{
              marginTop: "16px",
              marginBottom: 0,
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#6B7280",
            }}
          >
            The page could not be loaded. Please try again — if it keeps
            happening, contact us and quote the reference below.
          </p>

          {error.digest ? (
            <p
              style={{
                marginTop: "16px",
                marginBottom: 0,
                fontSize: "13px",
                color: "#6B7280",
              }}
            >
              Reference:{" "}
              <span style={{ fontWeight: 500, color: "#1F2937" }}>
                {error.digest}
              </span>
            </p>
          ) : null}

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                height: "48px",
                padding: "0 20px",
                border: "none",
                borderRadius: "8px",
                background: "#1D4ED8",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                height: "48px",
                display: "inline-flex",
                alignItems: "center",
                padding: "0 20px",
                border: "1px solid #1F2937",
                borderRadius: "8px",
                color: "#1F2937",
                fontSize: "15px",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Back to home
            </a>
          </div>

          <p
            style={{
              marginTop: "20px",
              marginBottom: 0,
              fontSize: "13px",
              color: "#6B7280",
            }}
          >
            Support: {site.supportEmail}
          </p>
        </main>
      </body>
    </html>
  );
}
