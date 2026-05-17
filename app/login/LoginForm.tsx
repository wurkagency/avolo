"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";

// ─── Typography tokens ────────────────────────────────────────────────────────
const t = {
  heading1:    { fontSize: 48, fontWeight: 400, lineHeight: 1.10, letterSpacing: "-0.02em" },
  subtitle:    { fontSize: 18, fontWeight: 400, lineHeight: 1.50 },
  bodySm:      { fontSize: 14, fontWeight: 400, lineHeight: 1.50 },
  buttonMd:    { fontSize: 14, fontWeight: 500, lineHeight: 1.30 },
  caption:     { fontSize: 13, fontWeight: 400, lineHeight: 1.40 },
  microUpper:  { fontSize: 11, fontWeight: 600, lineHeight: 1.40, letterSpacing: "1px", textTransform: "uppercase" as const },
};

const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin:      "Invalid email or password.",
  OAuthSignin:            "Something went wrong with Google sign-in. Please try again.",
  OAuthCallback:          "Something went wrong with Google sign-in. Please try again.",
  OAuthAccountNotLinked:  "This email is already linked to a different sign-in method.",
  Default:                "Something went wrong. Please try again.",
};

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const raw         = searchParams.get("callbackUrl") ?? "";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/explore";
  const urlError    = searchParams.get("error");

  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [error,         setError]         = useState<string | null>(
    urlError ? (AUTH_ERRORS[urlError] ?? AUTH_ERRORS.Default ?? null) : null,
  );
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email:    email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(AUTH_ERRORS.CredentialsSignin ?? "Invalid email or password.");
      }
    } catch {
      setError(AUTH_ERRORS.Default ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setGoogleLoading(false);
    }
  }

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--spacing-section) var(--spacing-md)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-xxl)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
          <h1 style={{
            ...t.heading1,
            fontFamily: "var(--font-editorial), 'Playfair Display', serif",
            color: "var(--color-ink)",
            margin: 0,
          }}>
            Sign in
          </h1>
          <p style={{ ...t.subtitle, color: "var(--color-steel)", margin: 0 }}>
            Welcome back to Avolo.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--spacing-xs)",
              backgroundColor: "var(--color-error-container)",
              border: "1px solid var(--color-error)",
              borderRadius: "var(--rounded-md)",
              padding: "var(--spacing-sm) var(--spacing-md)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-error)", flexShrink: 0, marginTop: 1 }} aria-hidden="true">
              error
            </span>
            <p style={{ ...t.bodySm, color: "var(--color-error)", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Credentials form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              ...t.buttonMd,
              marginTop: "var(--spacing-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--spacing-xs)",
              width: "100%",
              padding: "10px 20px",
              backgroundColor: canSubmit ? "var(--color-primary)" : "var(--color-hairline)",
              color: canSubmit ? "var(--color-on-primary)" : "var(--color-muted)",
              border: "none",
              borderRadius: "var(--rounded-md)",
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "background-color 120ms",
              minHeight: 44,
            }}
          >
            {loading ? (
              <span className="material-symbols-outlined" style={{ fontSize: 18, animation: "spin 1s linear infinite" }} aria-hidden="true">
                progress_activity
              </span>
            ) : (
              <>
                Sign In
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }} aria-hidden="true">
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--color-hairline)" }} />
          <span style={{ ...t.microUpper, color: "var(--color-steel)" }}>or</span>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--color-hairline)" }} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            ...t.buttonMd,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-sm)",
            width: "100%",
            padding: "10px 20px",
            backgroundColor: "var(--color-canvas)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-hairline-strong)",
            borderRadius: "var(--rounded-md)",
            cursor: googleLoading ? "not-allowed" : "pointer",
            opacity: googleLoading ? 0.6 : 1,
            transition: "opacity 120ms",
            minHeight: 44,
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Legal */}
        <p style={{ ...t.caption, color: "var(--color-steel)", textAlign: "center", margin: 0 }}>
          By signing in you agree to our{" "}
          <a href="/terms" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Terms</a>
          {" "}and{" "}
          <a href="/privacy" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Privacy Policy</a>.
        </p>

      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" role="img" focusable="false">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
