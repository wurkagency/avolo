"use client";

import { useEffect } from "react";

interface MicPermissionModalProps {
  state:     "prompt" | "denied";
  onAllow:   () => void;
  onDismiss: () => void;
}

export function MicPermissionModal({ state, onAllow, onDismiss }: MicPermissionModalProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  const isDenied = state === "denied";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-modal-title"
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         100,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "var(--spacing-md)",
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onDismiss}
        style={{
          position:        "absolute",
          inset:           0,
          backgroundColor: "var(--color-ink)",
          opacity:         0.45,
        }}
      />

      {/* Card */}
      <div
        style={{
          position:        "relative",
          width:           "100%",
          maxWidth:        360,
          backgroundColor: "var(--color-canvas)",
          borderRadius:    "var(--rounded-xl)",
          border:          "1px solid var(--color-hairline-soft)",
          padding:         "var(--spacing-xl)",
          display:         "flex",
          flexDirection:   "column",
          alignItems:      "center",
          gap:             "var(--spacing-md)",
          textAlign:       "center",
        }}
        className="shadow-xl"
      >
        {/* Icon */}
        <div
          style={{
            width:           56,
            height:          56,
            borderRadius:    "var(--rounded-lg)",
            backgroundColor: isDenied ? "var(--color-error-container)" : "var(--color-cream)",
            border:          `1px solid ${isDenied ? "var(--color-error)" : "var(--color-beige-deep)"}`,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            flexShrink:      0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize:              28,
              color:                 isDenied ? "var(--color-error)" : "var(--color-primary)",
              fontVariationSettings: "'FILL' 1",
            }}
            aria-hidden="true"
          >
            {isDenied ? "mic_off" : "mic"}
          </span>
        </div>

        {/* Title */}
        <h2
          id="mic-modal-title"
          style={{
            fontFamily: "var(--font-editorial), 'Playfair Display', serif",
            fontSize:   22,
            fontWeight: 400,
            lineHeight: 1.2,
            color:      "var(--color-ink)",
            margin:     0,
          }}
        >
          {isDenied ? "Microphone blocked" : "Allow microphone"}
        </h2>

        {/* Description */}
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize:   14,
            lineHeight: 1.6,
            color:      "var(--color-steel)",
            margin:     0,
          }}
        >
          {isDenied
            ? "Microphone access is blocked for this site. Click the lock icon in your browser's address bar, find Microphone, and set it to Allow. Then try again."
            : "Avolo needs your microphone to transcribe voice into a travel query. Your audio is processed locally by your browser and never sent to our servers."}
        </p>

        {/* Actions */}
        <div
          style={{
            display:       "flex",
            flexDirection: "column",
            gap:           "var(--spacing-sm)",
            width:         "100%",
            marginTop:     "var(--spacing-xs)",
          }}
        >
          {!isDenied && (
            <button
              type="button"
              onClick={onAllow}
              style={{
                width:           "100%",
                padding:         "13px",
                borderRadius:    "var(--rounded-md)",
                border:          "none",
                backgroundColor: "var(--color-primary)",
                color:           "var(--color-on-primary)",
                fontFamily:      "var(--font-inter)",
                fontSize:        15,
                fontWeight:      600,
                cursor:          "pointer",
              }}
            >
              Allow microphone
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            style={{
              width:           "100%",
              padding:         "13px",
              borderRadius:    "var(--rounded-md)",
              border:          "1px solid var(--color-hairline-strong)",
              backgroundColor: "transparent",
              color:           "var(--color-ink)",
              fontFamily:      "var(--font-inter)",
              fontSize:        15,
              fontWeight:      500,
              cursor:          "pointer",
            }}
          >
            {isDenied ? "Got it" : "Not now"}
          </button>
        </div>
      </div>
    </div>
  );
}
