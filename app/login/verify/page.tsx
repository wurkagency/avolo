import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Check your inbox",
};

export default function VerifyPage() {
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
          style={{ fontFamily: "var(--font-editorial)", fontSize: "32px", lineHeight: "1.2", fontWeight: 500 }}
          className="text-ink"
        >
          Check your inbox
        </h1>

        <p className="text-steel" style={{ fontSize: "16px", lineHeight: "1.5" }}>
          We sent you a sign-in link. Click the link in the email to continue.
          The link expires in 24 hours.
        </p>

        <p className="text-steel" style={{ fontSize: "14px", lineHeight: "1.5" }}>
          Didn&apos;t receive it? Check your spam folder, or{" "}
          <Link
            href="/login"
            className="text-primary underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            try again
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
