"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { TripSummary } from "@/components/trips/TripCard";

// ─── DESIGN.md typography tokens ────────────────────────────────────────────
const t = {
  heading5:      { fontSize: 18, fontWeight: 500, lineHeight: 1.40 },
  microUpper:    { fontSize: 11, fontWeight: 600, lineHeight: 1.40, letterSpacing: "1px", textTransform: "uppercase" as const },
  bodySm:        { fontSize: 14, fontWeight: 400, lineHeight: 1.50 },
  bodySmMedium:  { fontSize: 14, fontWeight: 500, lineHeight: 1.50 },
  buttonMd:      { fontSize: 14, fontWeight: 500, lineHeight: 1.30 },
  caption:       { fontSize: 13, fontWeight: 400, lineHeight: 1.40 },
  captionBold:   { fontSize: 13, fontWeight: 600, lineHeight: 1.40 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function groupByDate(trips: TripSummary[]) {
  const todayStr     = new Date().toDateString();
  const yestDate     = new Date(); yestDate.setDate(yestDate.getDate() - 1);
  const yestStr      = yestDate.toDateString();

  const today: TripSummary[]     = [];
  const yesterday: TripSummary[] = [];
  const earlier: TripSummary[]   = [];

  for (const trip of trips) {
    const d = new Date(trip.createdAt).toDateString();
    if (d === todayStr)  today.push(trip);
    else if (d === yestStr) yesterday.push(trip);
    else earlier.push(trip);
  }
  return { today, yesterday, earlier };
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{ ...t.microUpper, color: "var(--color-steel)", padding: "var(--spacing-lg) var(--spacing-md) var(--spacing-xxs)" }}>
      {label}
    </p>
  );
}

function TripItem({ trip, active }: { trip: TripSummary; active: boolean }) {
  const [hover, setHover] = useState(false);
  const label = trip.destinationName || trip.destination || "Trip";
  return (
    <Link
      href={`/trip/${trip.id}`}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...t.bodySm,
        display: "block",
        padding: "5px var(--spacing-md)",
        borderRadius: "var(--rounded-md)",
        color: active ? "var(--color-primary)" : "var(--color-ink)",
        backgroundColor: active || hover ? "var(--color-cream)" : "transparent",
        textDecoration: "none",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        transition: "background-color 100ms",
      }}
    >
      {label}
    </Link>
  );
}

function NavItem({
  href, icon, label, active, badge,
}: { href: string; icon: string; label: string; active: boolean; badge?: number }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...t.bodySm,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--spacing-sm) var(--spacing-md)",
        borderRadius: "var(--rounded-md)",
        color: active ? "var(--color-primary)" : "var(--color-ink)",
        backgroundColor: active || hover ? "var(--color-cream)" : "transparent",
        textDecoration: "none",
        transition: "background-color 100ms",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: active ? "var(--color-primary)" : "var(--color-steel)" }} aria-hidden="true">
          {icon}
        </span>
        {label}
      </span>
      {badge != null && (
        <span style={{
          ...t.captionBold,
          color: "var(--color-steel)",
          backgroundColor: "var(--color-hairline)",
          borderRadius: "var(--rounded-full)",
          padding: "1px 6px",
          minWidth: 20,
          textAlign: "center",
        }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [grouped, setGrouped] = useState<ReturnType<typeof groupByDate>>({ today: [], yesterday: [], earlier: [] });
  const [total, setTotal] = useState(0);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    fetch("/api/trips")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.trips) return;
        const trips = data.trips as TripSummary[];
        setTotal(trips.length);
        setGrouped(groupByDate(trips));
      })
      .catch(() => null);
  }, []);

  const groups = [
    { label: "Today",     items: grouped.today     },
    { label: "Yesterday", items: grouped.yesterday },
    { label: "Earlier",   items: grouped.earlier   },
  ].filter(g => g.items.length > 0);

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

      {/* ── Logo row ── */}
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
            style={{ color: "var(--color-primary)", fontSize: 22, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            aria-hidden="true"
          >
            flight_takeoff
          </span>
          {/* heading-5: Inter 500 18px */}
          <span style={{ ...t.heading5, fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--color-ink)", letterSpacing: "-0.2px" }}>
            avolo
          </span>
        </Link>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--spacing-md) var(--spacing-sm)", display: "flex", flexDirection: "column" }}>

        {/* Section header: "Trips N" */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--spacing-xs) var(--spacing-md) var(--spacing-sm)" }}>
          <span style={{ ...t.microUpper, color: "var(--color-steel)" }}>Trips</span>
          {total > 0 && (
            <span style={{ ...t.captionBold, color: "var(--color-steel)", backgroundColor: "var(--color-hairline)", borderRadius: "var(--rounded-full)", padding: "1px 7px" }}>
              {total}
            </span>
          )}
        </div>

        {/* button-primary spec: bg primary, on-primary text, rounded-md, 10px 20px padding, button-md type */}
        <div style={{ marginBottom: "var(--spacing-xs)" }}>
          <Link
            href="/explore"
            style={{
              ...t.buttonMd,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-on-primary)",
              borderRadius: "var(--rounded-md)",
              padding: "10px 20px",
              textDecoration: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "var(--spacing-xs)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">add</span>
              New trip
            </span>
            <span style={{ fontSize: 11, opacity: 0.65, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: "var(--rounded-xs)", padding: "2px 5px" }}>
              ⌘ T
            </span>
          </Link>
        </div>

        {/* Search */}
        <NavItem href="/trips"   icon="search"  label="Search trips" active={pathname === "/trips"} badge={undefined} />
        <NavItem href="/explore" icon="explore" label="Discover"     active={isActive("/explore")} />

        {/* ── Trip history groups ── */}
        {groups.map(({ label, items }) => (
          <div key={label}>
            <SectionLabel label={label} />
            {items.map(trip => (
              <TripItem key={trip.id} trip={trip} active={isActive(`/trip/${trip.id}`)} />
            ))}
          </div>
        ))}

        <div style={{ flex: 1 }} />
      </div>

      {/* ── Bottom strip ── */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--color-hairline-soft)" }}>

        {/* Settings + Journal */}
        <div style={{ padding: "var(--spacing-sm) var(--spacing-sm) 0" }}>
          <NavItem href="/profile/settings" icon="settings" label="Settings"       active={isActive("/profile/settings")} />
          <NavItem href="/journal"          icon="article"  label="Travel Journal" active={isActive("/journal")} />
        </div>

        {/* User strip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
          padding: "var(--spacing-md) var(--spacing-xl)",
          borderTop: "1px solid var(--color-hairline-soft)",
        }}>
          {session ? (
            <>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32,
                borderRadius: "var(--rounded-full)",
                backgroundColor: "var(--color-cream)",
                border: "1px solid var(--color-beige-deep)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                ...t.captionBold,
                color: "var(--color-ink)",
              }}>
                {(session.user?.name ?? session.user?.email ?? "U").charAt(0).toUpperCase()}
              </div>

              {/* Name / email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...t.caption, fontWeight: 500, color: "var(--color-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session.user?.name ?? session.user?.email}
                </div>
                {session.user?.name && session.user?.email && (
                  <div style={{ ...t.caption, color: "var(--color-steel)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {session.user.email}
                  </div>
                )}
              </div>

              {/* Options */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-steel)", display: "flex", alignItems: "center" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">more_horiz</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              style={{ ...t.bodySm, display: "flex", alignItems: "center", gap: "var(--spacing-sm)", color: "var(--color-steel)", textDecoration: "none" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">login</span>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
