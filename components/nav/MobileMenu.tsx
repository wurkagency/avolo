"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { href: "/explore", label: "Explore", icon: "explore" },
  { href: "/trips", label: "My Trips", icon: "luggage" },
  { href: "/journal", label: "Journal", icon: "article" },
  { href: "/profile/settings", label: "Profile", icon: "person" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Wire up the trigger button in TopBar via custom event / data attribute
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-mobile-menu-trigger]")) {
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink opacity-40"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        className="fixed inset-y-0 right-0 z-50 w-72 bg-surface shadow-2xl flex flex-col p-8 gap-6 anim-drawer"
        aria-label="Mobile navigation"
      >
        <button
          onClick={() => setOpen(false)}
          className="self-end text-steel hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        {navLinks.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded",
                active ? "text-primary" : "text-steel",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
