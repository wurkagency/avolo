"use client";

interface AIProviderErrorModalProps {
  providers: string[];
  onClose: () => void;
}

export function AIProviderErrorModal({ providers, onClose }: AIProviderErrorModalProps) {
  const providerList = providers.join(", ");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI provider error"
      style={{
        position:        "fixed",
        inset:           0,
        zIndex:          600,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "var(--spacing-lg)",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        backdropFilter:  "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width:           "100%",
          maxWidth:        440,
          backgroundColor: "var(--color-canvas)",
          borderRadius:    "var(--rounded-xl, 16px)",
          border:          "1px solid var(--color-hairline-soft)",
          boxShadow:       "0 8px 32px rgba(0,0,0,0.12)",
          padding:         "var(--spacing-xl)",
          display:         "flex",
          flexDirection:   "column",
          gap:             "var(--spacing-md)",
          animation:       "modalIn 0.2s ease forwards",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: "var(--color-error, #c0392b)", flexShrink: 0 }}
              aria-hidden="true"
            >
              warning
            </span>
            <h2
              style={{
                margin:     0,
                fontFamily: "var(--font-inter)",
                fontSize:   16,
                fontWeight: 700,
                color:      "var(--color-ink)",
                lineHeight: 1.3,
              }}
            >
              AI service error
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            style={{
              background:    "none",
              border:        "none",
              cursor:        "pointer",
              padding:       4,
              color:         "var(--color-steel)",
              flexShrink:    0,
              borderRadius:  "var(--rounded-sm)",
              display:       "flex",
              alignItems:    "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">close</span>
          </button>
        </div>

        {/* Body */}
        <p
          style={{
            margin:     0,
            fontFamily: "var(--font-inter)",
            fontSize:   14,
            lineHeight: 1.6,
            color:      "var(--color-steel)",
          }}
        >
          We have found an error with <strong style={{ color: "var(--color-ink)" }}>{providerList}</strong>.
          We have been notified and are very sorry about the inconvenience.
        </p>
        <p
          style={{
            margin:     0,
            fontFamily: "var(--font-inter)",
            fontSize:   13,
            lineHeight: 1.5,
            color:      "var(--color-muted)",
          }}
        >
          Your search results may not be AI-ranked. All available offers are still shown.
        </p>

        {/* Action */}
        <button
          type="button"
          onClick={onClose}
          style={{
            alignSelf:       "flex-end",
            padding:         "10px 20px",
            borderRadius:    "var(--rounded-md)",
            border:          "none",
            backgroundColor: "var(--color-primary)",
            color:           "var(--color-on-primary, #fff)",
            fontFamily:      "var(--font-inter)",
            fontSize:        14,
            fontWeight:      600,
            cursor:          "pointer",
          }}
        >
          Got it
        </button>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
