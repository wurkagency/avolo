import type { ReactNode } from "react";

interface ShellTopBarProps {
  left?: ReactNode;
  right?: ReactNode;
  onMenuToggle?: () => void;
}

export function ShellTopBar({ left, right, onMenuToggle }: ShellTopBarProps) {
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
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            aria-label="Open navigation"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--color-steel)",
              borderRadius: "var(--rounded-sm)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden="true">menu</span>
          </button>
        )}
        {left}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
        {right}
      </div>
    </header>
  );
}
