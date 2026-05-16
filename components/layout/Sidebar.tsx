"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { href: "/explore", label: "Explore",       icon: "search"   },
  { href: "/trips",   label: "My Trips",      icon: "luggage"  },
  { href: "/journal", label: "Travel Journal", icon: "article"  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside style={{
      width: 280,
      height: "100dvh",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "var(--color-canvas)",
      borderRight: "1px solid var(--color-hairline-soft)",
      overflow: "hidden",
    }}>

      {/* Logo — same height as ShellTopBar so they align */}
      <div style={{
        height: 64,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 var(--spacing-xl)",
        borderBottom: "1px solid var(--color-hairline-soft)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "var(--spacing-xs)", textDecoration: "none" }}>
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--color-primary)", fontSize: 24, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            aria-hidden="true"
          >
            flight_takeoff
          </span>
          <span style={{
            fontFamily: "var(--font-editorial)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--color-ink)",
            letterSpacing: "-0.3px",
          }}>
            avolo
          </span>
        </Link>
      </div>

      {/* New trip CTA */}
      <div style={{ padding: "var(--spacing-xl) var(--spacing-xl) var(--spacing-sm)" }}>
        <Link
          href="/explore"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-xs)",
            backgroundColor: "var(--color-primary)",
            color: "var(--color-on-primary)",
            borderRadius: "var(--rounded-md)",
            padding: "var(--spacing-sm) var(--spacing-md)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">add</span>
          New trip
        </Link>
      </div>

      {/* Nav */}
      <nav aria-label="Main navigation" style={{ padding: "0 var(--spacing-sm)", flexShrink: 0 }}>
        {navItems.map(({ href, label, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
                padding: "var(--spacing-sm) var(--spacing-md)",
                borderRadius: "var(--rounded-md)",
                color: active ? "var(--color-primary)" : "var(--color-steel)",
                backgroundColor: active ? "var(--color-cream)" : "transparent",
                fontSize: 14,
                fontWeight: active ? 500 : 400,
                textDecoration: "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom nav */}
      <div style={{
        flexShrink: 0,
        padding: "var(--spacing-sm)",
        borderTop: "1px solid var(--color-hairline-soft)",
      }}>
        <Link
          href="/profile/settings"
          aria-current={isActive("/profile") ? "page" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-sm)",
            padding: "var(--spacing-sm) var(--spacing-md)",
            borderRadius: "var(--rounded-md)",
            color: isActive("/profile") ? "var(--color-primary)" : "var(--color-steel)",
            backgroundColor: isActive("/profile") ? "var(--color-cream)" : "transparent",
            fontSize: 14,
            fontWeight: 400,
            textDecoration: "none",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">settings</span>
          Settings
        </Link>

        {/* User strip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
          padding: "var(--spacing-sm) var(--spacing-md)",
          marginTop: "var(--spacing-xxs)",
        }}>
          {session ? (
            <>
              {/* Avatar */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "var(--rounded-full)",
                backgroundColor: "var(--color-cream)",
                border: "1px solid var(--color-beige-deep)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-ink)",
              }}>
                {(session.user?.name ?? session.user?.email ?? "U").charAt(0).toUpperCase()}
              </div>
              {/* Name / email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--color-ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {session.user?.name ?? session.user?.email}
                </div>
                {session.user?.name && session.user?.email && (
                  <div style={{
                    fontSize: 11,
                    color: "var(--color-steel)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {session.user.email}
                  </div>
                )}
              </div>
              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                style={{
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "var(--color-steel)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
                color: "var(--color-steel)",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">login</span>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
