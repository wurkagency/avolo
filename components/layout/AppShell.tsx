"use client";

import { useEffect, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { ShellTopBar } from "./ShellTopBar";
import { SunsetStripeBand } from "@/components/ui/SunsetStripeBand";

interface AppShellProps {
  children: ReactNode;
  topBarLeft?: ReactNode;
  topBarRight?: ReactNode;
}

export function AppShell({ children, topBarLeft, topBarRight }: AppShellProps) {
  // Lock viewport scroll while shell is mounted; each panel scrolls independently
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = prev; };
  }, []);

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <Sidebar />

      {/* Right panel */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--color-surface)",
      }}>
        <ShellTopBar left={topBarLeft} right={topBarRight} />

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>

        <SunsetStripeBand />
      </div>
    </div>
  );
}
