import type { ReactNode } from "react";

interface ShellTopBarProps {
  left?: ReactNode;
  right?: ReactNode;
  onMenuToggle?: () => void;
}

export function ShellTopBar({ left, right, onMenuToggle }: ShellTopBarProps) {
  const isMobileBar = !!onMenuToggle;

  return (
    <header style={{
      position: "relative",
      height: 64,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 var(--spacing-md)",
      backgroundColor: "var(--color-canvas)",
      borderBottom: "1px solid var(--color-hairline-soft)",
    }}>
      {/* Left slot: hamburger (mobile) or left content (desktop) */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", zIndex: 1 }}>
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
              padding: 6,
              color: "var(--color-steel)",
              borderRadius: "var(--rounded-sm)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden="true">menu</span>
          </button>
        )}
        {!isMobileBar && left}
      </div>

      {/* Center: logo — absolutely centered on mobile */}
      {isMobileBar && left && (
        <div style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}>
          <div style={{ pointerEvents: "auto" }}>{left}</div>
        </div>
      )}

      {/* Right slot */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)", zIndex: 1 }}>
        {right}
      </div>
    </header>
  );
}
