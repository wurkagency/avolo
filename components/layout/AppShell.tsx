"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { ShellTopBar } from "./ShellTopBar";
import { SunsetStripeBand } from "@/components/ui/SunsetStripeBand";
import { AvoloLogo } from "@/components/ui/AvoloLogo";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";

interface AppShellProps {
  children: ReactNode;
  topBarLeft?: ReactNode;
  topBarRight?: ReactNode;
}

export function AppShell({ children, topBarLeft, topBarRight }: AppShellProps) {
  const bp = useBreakpoint();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMobile = bp === "xs" || bp === "sm";
  const isRail   = bp === "md";

  // Lock root scroll; each panel scrolls independently
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = prev; };
  }, []);

  // Close drawer on breakpoint change to desktop
  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>

      {/* ── Sidebar: full or rail on tablet/desktop ── */}
      {!isMobile && (
        <Sidebar variant={isRail ? "rail" : "full"} />
      )}

      {/* ── Mobile overlay drawer ── */}
      {isMobile && mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 190,
              backgroundColor: "rgba(31, 31, 31, 0.40)",
              backdropFilter: "blur(2px)",
            }}
          />
          {/* Drawer */}
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 200,
            height: "100dvh",
            boxShadow: "4px 0 24px rgba(0, 0, 0, 0.12)",
          }}>
            <Sidebar variant="full" onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* ── Right panel ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--color-surface)",
        minWidth: 0,
      }}>
        <ShellTopBar
          left={isMobile ? <AvoloLogo height={16} /> : topBarLeft}
          right={topBarRight}
          onMenuToggle={isMobile ? () => setMobileOpen(o => !o) : undefined}
        />

        <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {children}
        </main>

        <SunsetStripeBand />
      </div>
    </div>
  );
}
