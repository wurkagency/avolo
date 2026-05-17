"use client";

import { useState, useRef, KeyboardEvent } from "react";
import Link from "next/link";

const t = {
  bodyMd:       { fontSize: 16, fontWeight: 400, lineHeight: 1.55 },
  bodySm:       { fontSize: 14, fontWeight: 400, lineHeight: 1.50 },
  bodySmMedium: { fontSize: 14, fontWeight: 500, lineHeight: 1.50 },
  buttonMd:     { fontSize: 14, fontWeight: 500, lineHeight: 1.30 },
  caption:      { fontSize: 13, fontWeight: 400, lineHeight: 1.40 },
};

interface ChatInputBarProps {
  onSend?: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInputBar({ onSend, disabled, placeholder = "Ask anything about your trip…" }: ChatInputBarProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const msg = value.trim();
    if (!msg || disabled) return;
    onSend?.(msg);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div style={{
      flexShrink: 0,
      backgroundColor: "var(--color-canvas)",
      borderTop: "1px solid var(--color-hairline-soft)",
      padding: "var(--spacing-md) var(--spacing-xl)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-sm)",
    }}>
      {/* Input row */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "var(--spacing-sm)",
      }}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          style={{
            ...t.bodyMd,
            flex: 1,
            resize: "none",
            overflow: "hidden",
            minHeight: 44,
            maxHeight: 200,
            backgroundColor: "var(--color-canvas)",
            color: "var(--color-ink)",
            border: focused
              ? "2px solid var(--color-primary)"
              : "1px solid var(--color-hairline-strong)",
            borderRadius: "var(--rounded-md)",
            padding: "var(--spacing-sm) var(--spacing-md)",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.55,
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            ...t.buttonMd,
            flexShrink: 0,
            height: 44,
            padding: "10px 20px",
            backgroundColor: canSend ? "var(--color-primary)" : "var(--color-hairline)",
            color: canSend ? "var(--color-on-primary)" : "var(--color-muted)",
            borderRadius: "var(--rounded-md)",
            border: "none",
            cursor: canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-xs)",
            transition: "background-color 120ms",
            whiteSpace: "nowrap",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            send
          </span>
          Send
        </button>
      </div>

      {/* Tool row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-md)",
      }}>
        <Link
          href="/profile/preferences"
          style={{ ...t.bodySm, color: "var(--color-steel)", textDecoration: "none", display: "flex", alignItems: "center", gap: "var(--spacing-xs)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">build</span>
          Tools
        </Link>
        <Link
          href="/trips"
          style={{ ...t.bodySm, color: "var(--color-steel)", textDecoration: "none", display: "flex", alignItems: "center", gap: "var(--spacing-xs)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">history</span>
          Previous Searches
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Disclaimer */}
        <p style={{
          ...t.caption,
          color: "var(--color-muted)",
          margin: 0,
          textAlign: "center",
        }}>
          Avolo can make mistakes. Verify important travel details.
        </p>
      </div>
    </div>
  );
}
