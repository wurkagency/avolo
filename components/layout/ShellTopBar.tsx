import type { ReactNode } from "react";

interface ShellTopBarProps {
  left?: ReactNode;
  right?: ReactNode;
}

export function ShellTopBar({ left, right }: ShellTopBarProps) {
  return (
    <header style={{
      height: 64,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 var(--spacing-xxl)",
      backgroundColor: "var(--color-canvas)",
      borderBottom: "1px solid var(--color-hairline-soft)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
        {left}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
        {right}
      </div>
    </header>
  );
}
