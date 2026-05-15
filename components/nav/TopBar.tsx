"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/trips", label: "My Trips" },
  { href: "/journal", label: "Journal" },
];

export function TopBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="fixed top-0 w-full z-50 bg-background border-b border-outline-variant">
      <div className="flex items-center justify-between px-gutter py-4 max-w-container-max mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          aria-label="Avolo — home"
        >
          <span
            className="material-symbols-outlined text-primary"
            aria-hidden="true"
            style={{ fontSize: "28px", fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            flight_takeoff
          </span>
          <span
            className="text-primary font-bold tracking-tight leading-none"
            style={{ fontFamily: "var(--font-manrope)", fontSize: "20px" }}
          >
            avolo
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navLinks.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded",
                  active ? "text-primary" : "text-on-surface-variant",
                )}
                style={{ fontFamily: "var(--font-inter)", fontSize: "12px", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}

          {/* Auth state */}
          {status === "loading" ? null : session ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile/settings"
                className={cn(
                  "transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded",
                  pathname.startsWith("/profile") ? "text-primary" : "text-on-surface-variant",
                )}
                style={{ fontFamily: "var(--font-inter)", fontSize: "12px", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}
              >
                Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                style={{ fontFamily: "var(--font-inter)", fontSize: "12px", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              style={{ fontFamily: "var(--font-inter)", fontSize: "12px", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}
            >
              Sign in
            </Link>
          )}
        </nav>

        {/* Mobile menu trigger */}
        <button
          className="md:hidden text-on-surface-variant hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
          aria-label="Open menu"
          data-mobile-menu-trigger
        >
          <span className="material-symbols-outlined" aria-hidden="true">menu</span>
        </button>
      </div>
    </header>
  );
}
