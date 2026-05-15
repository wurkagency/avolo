"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const errorMessages: Record<string, string> = {
  OAuthSignin: "Something went wrong with social sign-in. Please try again.",
  OAuthCallback: "Something went wrong with social sign-in. Please try again.",
  OAuthCreateAccount: "Could not create an account. Please try again.",
  EmailCreateAccount: "Could not create an account. Please try again.",
  Callback: "Something went wrong. Please try again.",
  OAuthAccountNotLinked: "This email is already linked to a different sign-in method.",
  EmailSignin: "Could not send the sign-in link. Please check your email address.",
  CredentialsSignin: "Invalid credentials.",
  SessionRequired: "Please sign in to continue.",
  Default: "Something went wrong. Please try again.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("callbackUrl") ?? "";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/explore/services";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const errorMessage = error ? (errorMessages[error] ?? errorMessages.Default) : null;

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    try {
      const result = await signIn("nodemailer", {
        email: email.trim(),
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        console.error("[login] Email sign-in error:", result.error);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setGoogleLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-72px)] px-gutter py-section-padding">
        <div className="w-full max-w-sm flex flex-col gap-6 text-center">
          <span
            className="material-symbols-outlined text-primary mx-auto"
            style={{ fontSize: "48px", fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}
            aria-hidden="true"
          >
            mark_email_read
          </span>
          <h1
            style={{ fontFamily: "var(--font-manrope)", fontSize: "32px", lineHeight: "1.2", fontWeight: 500 }}
            className="text-on-background"
          >
            Check your inbox
          </h1>
          <p className="text-on-surface-variant" style={{ fontSize: "16px", lineHeight: "1.5" }}>
            We sent a sign-in link to{" "}
            <strong className="text-on-surface">{email}</strong>. Click the link
            to continue — it expires in 24 hours.
          </p>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="text-primary underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            style={{ fontSize: "14px" }}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-72px)] px-gutter py-section-padding">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1
            style={{ fontFamily: "var(--font-manrope)", fontSize: "48px", lineHeight: "1.1", letterSpacing: "-0.02em" }}
            className="text-on-background"
          >
            Sign in
          </h1>
          <p className="text-on-surface-variant" style={{ fontSize: "20px", lineHeight: "1.6" }}>
            No password required.
          </p>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 bg-error-container border border-error rounded-xl px-4 py-3"
          >
            <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5" aria-hidden="true">
              error
            </span>
            <p className="text-error" style={{ fontSize: "14px", lineHeight: "1.5" }}>{errorMessage}</p>
          </div>
        )}

        {/* Google sign-in */}
        <Button
          variant="secondary"
          size="lg"
          loading={googleLoading}
          onClick={handleGoogleSignIn}
          className="w-full gap-3"
          type="button"
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-4" aria-hidden="true">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="text-on-surface-variant" style={{ fontSize: "12px", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}>
            or
          </span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* Magic link form */}
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
            disabled={!email.trim()}
          >
            Send sign-in link
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </Button>
        </form>

        {/* Legal */}
        <p className="text-on-surface-variant text-center" style={{ fontSize: "12px", lineHeight: "1.5" }}>
          By signing in you agree to our{" "}
          <a href="/terms" className="text-primary underline underline-offset-1 hover:opacity-80">Terms</a>
          {" "}and{" "}
          <a href="/privacy" className="text-primary underline underline-offset-1 hover:opacity-80">Privacy Policy</a>.
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
