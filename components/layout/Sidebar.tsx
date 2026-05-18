"use client";

import { useState, useEffect, useRef } from "react";
import { AvoloLogo } from "@/components/ui/AvoloLogo";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { TripSummary } from "@/components/trips/TripCard";

export type SidebarVariant = "full" | "rail";

// ─── Typography tokens ────────────────────────────────────────────────────────
const t = {
  heading5:      { fontSize: 18, fontWeight: 500, lineHeight: 1.40 },
  microUpper:    { fontSize: 11, fontWeight: 600, lineHeight: 1.40, letterSpacing: "1px", textTransform: "uppercase" as const },
  bodySm:        { fontSize: 14, fontWeight: 400, lineHeight: 1.50 },
  bodySmMedium:  { fontSize: 14, fontWeight: 500, lineHeight: 1.50 },
  buttonMd:      { fontSize: 14, fontWeight: 500, lineHeight: 1.30 },
  caption:       { fontSize: 13, fontWeight: 400, lineHeight: 1.40 },
  captionBold:   { fontSize: 13, fontWeight: 600, lineHeight: 1.40 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function groupByDate(trips: TripSummary[]) {
  const todayStr = new Date().toDateString();
  const yestDate = new Date(); yestDate.setDate(yestDate.getDate() - 1);
  const yestStr  = yestDate.toDateString();
  const today: TripSummary[] = [], yesterday: TripSummary[] = [], earlier: TripSummary[] = [];
  for (const trip of trips) {
    const d = new Date(trip.createdAt).toDateString();
    if (d === todayStr) today.push(trip);
    else if (d === yestStr) yesterday.push(trip);
    else earlier.push(trip);
  }
  return { today, yesterday, earlier };
}

function fmtShort(dateStr: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(dateStr));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{ ...t.microUpper, color: "var(--color-steel)", padding: "var(--spacing-lg) var(--spacing-md) var(--spacing-xxs)", margin: 0 }}>
      {label}
    </p>
  );
}

function TripItem({ trip, active, onDelete }: { trip: TripSummary; active: boolean; onDelete: (id: string) => void }) {
  const [hover, setHover] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const destination = trip.destinationName || trip.destination || "Trip";
  const dateFrom = fmtShort(trip.departureDate);
  const dateTo = trip.returnDate ? fmtShort(trip.returnDate) : null;
  const label = dateTo ? `${destination}, ${dateFrom} – ${dateTo}` : `${destination}, ${dateFrom}`;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      await fetch(`/api/trips/${encodeURIComponent(trip.id)}`, { method: "DELETE" });
      onDelete(trip.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 2 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={`/trip/${trip.id}`}
        aria-current={active ? "page" : undefined}
        title={label}
        style={{
          ...t.bodySm,
          flex: 1,
          minWidth: 0,
          display: "block",
          padding: "5px var(--spacing-xs) 5px var(--spacing-md)",
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
      <button
        onClick={(e) => void handleDelete(e)}
        disabled={deleting}
        title="Remove search"
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          borderRadius: "var(--rounded-xs)",
          cursor: "pointer",
          color: "var(--color-stone)",
          padding: 0,
          opacity: hover ? 1 : 0,
          transition: "opacity 100ms",
          pointerEvents: hover ? "auto" : "none",
        }}
        aria-hidden={!hover}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden="true">close</span>
      </button>
    </div>
  );
}

function NavItem({
  href, icon, label, active, badge, rail,
}: { href: string; icon: string; label: string; active: boolean; badge?: number; rail?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={rail ? label : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...t.bodySm,
        display: "flex",
        alignItems: "center",
        justifyContent: rail ? "center" : "space-between",
        padding: rail ? "var(--spacing-sm)" : "var(--spacing-sm) var(--spacing-md)",
        borderRadius: "var(--rounded-md)",
        color: active ? "var(--color-primary)" : "var(--color-ink)",
        backgroundColor: active || hover ? "var(--color-cream)" : "transparent",
        textDecoration: "none",
        transition: "background-color 100ms",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: rail ? 0 : "var(--spacing-sm)" }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: active ? "var(--color-primary)" : "var(--color-steel)" }}
          aria-hidden="true"
        >
          {icon}
        </span>
        {!rail && label}
      </span>
      {!rail && badge != null && (
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

// ─── Rail: icon-only new-trip button ─────────────────────────────────────────
function RailNewTripButton() {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href="/explore"
      title="New trip"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        borderRadius: "var(--rounded-md)",
        backgroundColor: hover ? "var(--color-primary-deep)" : "var(--color-primary)",
        color: "var(--color-on-primary)",
        textDecoration: "none",
        transition: "background-color 120ms",
        margin: "0 auto",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">add</span>
    </Link>
  );
}

// ─── User menu dropdown ───────────────────────────────────────────────────────
const MENU_ITEMS = [
  { href: "/profile/settings",      icon: "manage_accounts", label: "Settings"      },
  { href: "/profile/preferences",   icon: "tune",            label: "Preferences"   },
  { href: "/profile/notifications", icon: "notifications",   label: "Notifications" },
] as const;

function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  if (!session) return null;

  return (
    <div ref={ref} style={{ flexShrink: 0, position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          color: "var(--color-steel)",
          display: "flex",
          alignItems: "center",
          borderRadius: "var(--rounded-sm)",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">more_horiz</span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            right: 0,
            width: 188,
            backgroundColor: "var(--color-canvas)",
            border: "1px solid var(--color-hairline-soft)",
            borderRadius: "var(--rounded-lg)",
            boxShadow: "rgba(0,0,0,0.08) 0px 4px 16px -2px",
            padding: "var(--spacing-xxs)",
            zIndex: 300,
          }}
        >
          {MENU_ITEMS.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              style={{
                ...t.bodySm,
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
                padding: "var(--spacing-xs) var(--spacing-sm)",
                borderRadius: "var(--rounded-md)",
                color: "var(--color-ink)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-steel)" }} aria-hidden="true">{icon}</span>
              {label}
            </Link>
          ))}

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: "var(--color-hairline-soft)", margin: "var(--spacing-xxs) 0" }} />

          <button
            role="menuitem"
            onClick={() => { setOpen(false); void signOut({ callbackUrl: "/" }); }}
            style={{
              ...t.bodySm,
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              padding: "var(--spacing-xs) var(--spacing-sm)",
              borderRadius: "var(--rounded-md)",
              color: "var(--color-ink)",
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-steel)" }} aria-hidden="true">logout</span>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
interface SidebarProps {
  variant?: SidebarVariant;
  onClose?: () => void;
}

export function Sidebar({ variant = "full", onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [grouped, setGrouped] = useState<ReturnType<typeof groupByDate>>({ today: [], yesterday: [], earlier: [] });
  const [total, setTotal] = useState(0);

  const rail = variant === "rail";
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

  function handleDeleteTrip(id: string) {
    setGrouped(prev => {
      const filter = (arr: TripSummary[]) => arr.filter(t => t.id !== id);
      const next = { today: filter(prev.today), yesterday: filter(prev.yesterday), earlier: filter(prev.earlier) };
      setTotal(next.today.length + next.yesterday.length + next.earlier.length);
      return next;
    });
  }

  const groups = [
    { label: "Today",     items: grouped.today     },
    { label: "Yesterday", items: grouped.yesterday },
    { label: "Earlier",   items: grouped.earlier   },
  ].filter(g => g.items.length > 0);

  const sidebarWidth = rail ? 64 : 280;

  return (
    <aside style={{
      width: sidebarWidth,
      height: "100dvh",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "var(--color-canvas)",
      borderRight: "1px solid var(--color-hairline-soft)",
      overflow: "hidden",
      transition: "width 200ms ease",
    }}>

      {/* ── Logo row ── */}
      <div style={{
        height: 64,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: rail ? "center" : "space-between",
        padding: rail ? 0 : "0 var(--spacing-md) 0 var(--spacing-xl)",
        borderBottom: "1px solid var(--color-hairline-soft)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          {rail
            ? <AvoloLogo iconOnly height={22} />
            : <AvoloLogo height={18} />
          }
        </Link>

        {/* Close button — only shown in mobile drawer (onClose provided) */}
        {!rail && onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: "var(--color-steel)",
              borderRadius: "var(--rounded-sm)",
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">close</span>
          </button>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "var(--spacing-md) var(--spacing-xs)",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Trips count header — full only */}
        {!rail && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--spacing-xs) var(--spacing-md) var(--spacing-sm)" }}>
            <span style={{ ...t.microUpper, color: "var(--color-steel)" }}>Trips</span>
            {total > 0 && (
              <span style={{ ...t.captionBold, color: "var(--color-steel)", backgroundColor: "var(--color-hairline)", borderRadius: "var(--rounded-full)", padding: "1px 7px" }}>
                {total}
              </span>
            )}
          </div>
        )}

        {/* New trip button */}
        <div style={{ marginBottom: "var(--spacing-xs)", padding: rail ? "0 var(--spacing-xs)" : "0 0 var(--spacing-xs)" }}>
          {rail ? (
            <RailNewTripButton />
          ) : (
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
              <span style={{ fontSize: 11, opacity: 0.65, backgroundColor: "rgba(255, 255, 255, 0.18)", borderRadius: "var(--rounded-xs)", padding: "2px 5px" }}>
                ⌘ T
              </span>
            </Link>
          )}
        </div>

        {/* Nav items */}
        <NavItem href="/trips"   icon="luggage"   label="My Trips" active={pathname === "/trips"} rail={rail} />
        <NavItem href="#"        icon="explore"   label="Discover" active={false}                 rail={rail} />
        <NavItem href="/journal" icon="menu_book" label="Guides"   active={isActive("/journal")}  rail={rail} />

        {/* Trip history — full only */}
        {!rail && groups.map(({ label, items }) => (
          <div key={label}>
            <SectionLabel label={label} />
            {items.map(trip => (
              <TripItem key={trip.id} trip={trip} active={isActive(`/trip/${trip.id}`)} onDelete={handleDeleteTrip} />
            ))}
          </div>
        ))}

        <div style={{ flex: 1 }} />
      </div>

      {/* ── Bottom strip ── */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--color-hairline-soft)" }}>

        {/* User strip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
          padding: rail ? "var(--spacing-md) 0" : "var(--spacing-md) var(--spacing-md)",
          justifyContent: rail ? "center" : "flex-start",
        }}>
          {session ? (
            <>
              <div style={{
                width: 32, height: 32,
                borderRadius: "var(--rounded-full)",
                overflow: "hidden",
                backgroundColor: "var(--color-cream)",
                border: "1px solid var(--color-beige-deep)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                position: "relative",
                ...t.captionBold,
                color: "var(--color-ink)",
              }}
              title={rail ? (session.user?.name ?? session.user?.email ?? undefined) : undefined}
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    fill
                    sizes="32px"
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                ) : (
                  (session.user?.name ?? session.user?.email ?? "U").charAt(0).toUpperCase()
                )}
              </div>

              {!rail && (
                <>
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
                  <UserMenu />
                </>
              )}
            </>
          ) : (
            <Link
              href="/login"
              title={rail ? "Sign in" : undefined}
              style={{ ...t.bodySm, display: "flex", alignItems: "center", gap: "var(--spacing-sm)", color: "var(--color-steel)", textDecoration: "none" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">login</span>
              {!rail && "Sign in"}
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
