"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { useTripStore } from "@/lib/state/tripStore";
import { useUiStore } from "@/lib/state/uiStore";
import type { ParsedQuery } from "@/types/trip";
import { MicPermissionModal } from "@/components/ui/MicPermissionModal";
import { AvoloLogo } from "@/components/ui/AvoloLogo";
import { AIProviderErrorModal } from "@/components/results/AIProviderErrorModal";

// ─── Typography ───────────────────────────────────────────────────────────────
const t = {
  bodySm:       { fontSize: 14, fontWeight: 400, lineHeight: 1.50 },
  bodySmMedium: { fontSize: 14, fontWeight: 500, lineHeight: 1.50 },
  bodyMd:       { fontSize: 16, fontWeight: 400, lineHeight: 1.55 },
  caption:      { fontSize: 13, fontWeight: 400, lineHeight: 1.40 },
};

// ─── Hero type scale (DESIGN.md breakpoint table) ────────────────────────────
const heroScale = {
  xl: { hero: 84, heroTracking: "-1.5px", subtitle: 36, subtitleTracking: "-0.3px" },
  lg: { hero: 76, heroTracking: "-1.2px", subtitle: 30, subtitleTracking: "-0.2px" },
  md: { hero: 64, heroTracking: "-1px",   subtitle: 26, subtitleTracking: "-0.1px" },
  sm: { hero: 52, heroTracking: "-0.5px", subtitle: 22, subtitleTracking: "0px"    },
  xs: { hero: 40, heroTracking: "-0.3px", subtitle: 20, subtitleTracking: "0px"    },
} as const;

// ─── Quick-action chips ───────────────────────────────────────────────────────
const CHIPS = [
  { label: "Find cheap flights", icon: "flight",         href: "/explore" },
  { label: "Discover Hotels",    icon: "hotel",          href: "/explore" },
  { label: "Rent a car",         icon: "directions_car", href: "/explore" },
  { label: "Explore locally",    icon: "explore",        href: "/explore" },
] as const;

function Chip({ label, icon, href }: { label: string; icon: string; href: string }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...t.bodySmMedium,
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--spacing-xs)",
        padding: "10px 16px",
        backgroundColor: "var(--color-canvas)",
        border: `1px solid ${hover ? "var(--color-primary)" : "var(--color-hairline-soft)"}`,
        borderRadius: "var(--rounded-lg)",
        color: hover ? "var(--color-primary)" : "var(--color-ink)",
        textDecoration: "none",
        transition: "border-color 120ms, color 120ms",
        whiteSpace: "nowrap",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 16,
          color: hover ? "var(--color-primary)" : "var(--color-steel)",
          transition: "color 120ms",
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}

// ─── Speech recognition ───────────────────────────────────────────────────────
// Minimal local types so we don't depend on whether the project's DOM lib
// version includes the Speech Recognition API.

interface SpeechAlt       { readonly transcript: string }
interface SpeechResult    { readonly length: number; readonly [i: number]: SpeechAlt }
interface SpeechResultList{ readonly length: number; readonly [i: number]: SpeechResult }
interface SpeechResultEvt { readonly results: SpeechResultList; readonly resultIndex: number }
interface SpeechErrorEvt  { readonly error: string }

interface SpeechRecognitionInstance {
  continuous:     boolean;
  interimResults: boolean;
  lang:           string;
  onstart: (() => void) | null;
  onresult: ((e: SpeechResultEvt) => void) | null;
  onerror:  ((e: SpeechErrorEvt)  => void) | null;
  onend:    (() => void) | null;
  start(): void;
  stop():  void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?:       SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ─── Embedded conversational input ───────────────────────────────────────────

interface HomeInputProps {
  onAiError?: (providers: string[]) => void;
}

function HomeInput({ onAiError }: HomeInputProps) {
  const router     = useRouter();
  const addToast   = useUiStore((s) => s.addToast);

  // On fresh mount: clear input unless the user explicitly clicked "Edit query"
  // (signalled by sessionStorage flag set in QueryConfirmCard).
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return "";
    const isEdit = sessionStorage.getItem("avolo_edit_mode");
    if (isEdit) {
      sessionStorage.removeItem("avolo_edit_mode");
      return useTripStore.getState().rawQuery;
    }
    // Fresh navigation — reset rawQuery so the store stays consistent
    useTripStore.getState().setRawQuery("");
    return "";
  });

  const [focused,      setFocused]     = useState(false);
  const [loading,      setLoading]     = useState(false);
  const [isListening,  setIsListening] = useState(false);
  const [showMicModal, setShowMicModal] = useState(false);
  const [micPermState, setMicPermState] = useState<"prompt" | "denied">("prompt");
  // Detect mic support after mount (window not available on server).
  const [micSupported, setMicSupported] = useState(false);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const micRetryRef    = useRef(false);

  useEffect(() => {
    setMicSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  // Resize textarea whenever value changes; enforce 2-row minimum (52px).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(Math.max(el.scrollHeight, 52), 200) + "px";
  }, [value]);

  // Stop any active recognition when the component unmounts.
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  async function handleSend() {
    const q = value.trim();
    if (!q || loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/interpret-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const parsed = await res.json() as ParsedQuery;

      // Surface AI provider failures early
      if (parsed.aiWarning && onAiError) {
        onAiError(parsed.aiWarning.split(", "));
      }

      // Clear any stale trip data from a previous search before applying the new query.
      // Without this, old fields (e.g. previous departure airport) bleed into the new search.
      const store = useTripStore.getState();
      store.reset();
      store.setRawQuery(q);

      if (parsed.departure)        store.setDeparture(parsed.departure);
      if (parsed.destination)      store.setDestination(parsed.destination);
      if (parsed.services?.length) store.setServices(parsed.services);

      if (parsed.departureDate) {
        store.setDates(parsed.departureDate, parsed.returnDate ?? null, parsed.isOneWay ?? false);
      } else if (parsed.filledFields.includes("isOneWay")) {
        store.setIsOneWay(parsed.isOneWay ?? false);
      }

      if (parsed.flexibility) store.setFlexibility(parsed.flexibility);

      if (parsed.adults !== undefined || parsed.children !== undefined) {
        store.setTravelers(
          parsed.adults        ?? 1,
          parsed.children      ?? [],
          parsed.hasDisability ?? false,
        );
      }

      if (
        parsed.handLuggage    !== undefined ||
        parsed.checkedLuggage !== undefined ||
        parsed.specialLuggage !== undefined
      ) {
        store.setLuggage(
          parsed.handLuggage    ?? 1,
          parsed.checkedLuggage ?? 0,
          parsed.specialLuggage ?? false,
        );
      }

      store.setLastFilledFields(parsed.filledFields);
      router.push("/explore/confirm");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(Math.max(el.scrollHeight, 52), 200) + "px";
  }

  // Must remain synchronous — Chrome requires recognition.start() to be called
  // within the same user gesture call stack, or it throws a not-allowed error.
  function doStartRecognition() {
    const SR = getSpeechRecognitionCtor();
    if (!SR) {
      addToast("Speech recognition is not supported in this browser", "info");
      return;
    }

    recognitionRef.current?.stop();

    const recognition = new SR();
    recognition.continuous     = false;
    recognition.interimResults = true;
    recognition.lang           = navigator.language || "en-US";

    recognition.onstart = () => { micRetryRef.current = false; setIsListening(true); };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((r) => r[0]?.transcript ?? "")
        .join("");
      setValue(transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        const wasRetry = micRetryRef.current;
        micRetryRef.current = false;
        void navigator.permissions
          .query({ name: "microphone" as PermissionName })
          .then((p) => {
            // Two cases mean Permissions-Policy is blocking the API:
            // 1. Browser says "granted" but recognition still fired not-allowed.
            // 2. This was a retry from our Allow button yet still got not-allowed —
            //    meaning the browser never showed its native dialog (policy blocked it).
            if (p.state === "granted" || wasRetry) {
              addToast(
                "Microphone blocked. In your browser address bar click the lock icon → Permissions → Microphone → Allow.",
                "error",
              );
            } else {
              setMicPermState(p.state === "denied" ? "denied" : "prompt");
              setShowMicModal(true);
            }
          })
          .catch(() => {
            setMicPermState("prompt");
            setShowMicModal(true);
          });
      } else if (event.error === "no-speech") {
        addToast("No speech detected — try again", "info");
      } else if (event.error !== "aborted") {
        addToast(`Microphone error: ${event.error}`, "error");
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      addToast("Could not start voice input", "error");
    }
  }

  function handleMicAllow() {
    setShowMicModal(false);
    micRetryRef.current = true;
    doStartRecognition();
  }

  // Request mic permission via getUserMedia before invoking SpeechRecognition so the
  // browser shows its native permission dialog. Without this, Chrome silently fires
  // not-allowed when the page hasn't been granted mic access yet.
  async function handleMic() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    if ("mediaDevices" in navigator) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release immediately — we only needed the permission grant
        stream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          void navigator.permissions
            .query({ name: "microphone" as PermissionName })
            .then((p) => {
              setMicPermState(p.state === "denied" ? "denied" : "prompt");
              setShowMicModal(true);
            })
            .catch(() => { setMicPermState("prompt"); setShowMicModal(true); });
        } else {
          addToast("Microphone not available — check browser settings", "error");
        }
        return;
      }
    }

    doStartRecognition();
  }

  const hasText = value.trim().length > 0;
  const canSend = hasText && !loading;

  return (
    <>
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        border: focused
          ? "2px solid var(--color-primary)"
          : "1px solid var(--color-hairline-strong)",
        borderRadius: "var(--rounded-lg)",
        backgroundColor: "var(--color-canvas)",
        overflow: "hidden",
        transition: "border-color 120ms",
        boxShadow: focused ? "0 0 0 3px rgba(250, 82, 15, 0.08)" : "none",
      }}
    >
      {/* Textarea row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          padding: "var(--spacing-md) var(--spacing-md) var(--spacing-xs)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 18,
            color: loading ? "var(--color-steel)" : "var(--color-primary)",
            marginRight: "var(--spacing-sm)",
            marginTop: 2,
            flexShrink: 0,
            transition: "color 150ms",
          }}
          aria-hidden="true"
        >
          {loading ? "hourglass_top" : "auto_awesome"}
        </span>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={loading}
          placeholder='Where do you want to go? Try "Flights to Toscana in July"…'
          rows={2}
          style={{
            ...t.bodyMd,
            flex: 1,
            resize: "none",
            overflow: "hidden",
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            color: "var(--color-ink)",
            fontFamily: "inherit",
            minHeight: 52,
            maxHeight: 200,
            lineHeight: 1.55,
            opacity: loading ? 0.6 : 1,
          }}
        />
      </div>

      {/* Toolbar row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
          padding: "var(--spacing-xs) var(--spacing-md) var(--spacing-md)",
          borderTop: "1px solid var(--color-hairline-soft)",
          marginTop: "var(--spacing-xs)",
        }}
      >
        <Link
          href="/profile/preferences"
          style={{
            ...t.bodySm,
            color: "var(--color-steel)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-xxs)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">
            build
          </span>
          Tools
        </Link>
        <Link
          href="/trips"
          style={{
            ...t.bodySm,
            color: "var(--color-steel)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-xxs)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">
            history
          </span>
          Previous Searches
        </Link>

        <div style={{ flex: 1 }} />

        {/* Mic button — only shown when Web Speech API is available (not iOS Safari) */}
        {micSupported && (
          <button
            type="button"
            onClick={() => void handleMic()}
            disabled={loading}
            aria-label={isListening ? "Stop recording" : "Start voice input"}
            aria-pressed={isListening}
            style={{
              width:           36,
              height:          36,
              borderRadius:    "var(--rounded-md)",
              border:          "none",
              cursor:          loading ? "not-allowed" : "pointer",
              backgroundColor: "var(--color-primary)",
              color:           "var(--color-on-primary)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              flexShrink:      0,
              opacity:         loading ? 0.5 : 1,
              animation:       isListening ? "mic-pulse 1.4s ease-in-out infinite" : "none",
              transition:      "opacity 120ms",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              {isListening ? "mic_off" : "mic"}
            </span>
          </button>
        )}

        {/* Send button — dark styling */}
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend}
          aria-disabled={!canSend}
          aria-label={loading ? "Parsing your query…" : "Send"}
          style={{
            width:           36,
            height:          36,
            borderRadius:    "var(--rounded-md)",
            border:          "none",
            cursor:          canSend ? "pointer" : "not-allowed",
            backgroundColor: canSend ? "var(--color-ink)" : "var(--color-hairline)",
            color:           canSend ? "var(--color-canvas)" : "var(--color-muted)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            flexShrink:      0,
            transition:      "background-color 120ms",
          }}
        >
          {loading ? (
            <span
              className="animate-spin"
              style={{
                display:         "inline-block",
                width:           16,
                height:          16,
                border:          "2px solid currentColor",
                borderTopColor:  "transparent",
                borderRadius:    "50%",
              }}
            />
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              arrow_upward
            </span>
          )}
        </button>
      </div>

      <style>{`
        @keyframes mic-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(250, 82, 15, 0.08); }
          70%  { box-shadow: 0 0 0 8px transparent; }
          100% { box-shadow: 0 0 0 0   transparent; }
        }
      `}</style>
    </div>

    {showMicModal && (
      <MicPermissionModal
        state={micPermState}
        onAllow={handleMicAllow}
        onDismiss={() => setShowMicModal(false)}
      />
    )}
    </>
  );
}

// ─── WelcomeState ─────────────────────────────────────────────────────────────

export function WelcomeState() {
  const bp       = useBreakpoint();
  const scale    = heroScale[bp];
  const isMobile = bp === "xs" || bp === "sm";
  const { data: session } = useSession();
  const [aiErrorProviders, setAiErrorProviders] = useState<string[]>([]);
  const [aiModalDismissed, setAiModalDismissed] = useState(false);

  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  return (
    <>
    {aiErrorProviders.length > 0 && !aiModalDismissed && (
      <AIProviderErrorModal
        providers={aiErrorProviders}
        onClose={() => setAiModalDismissed(true)}
      />
    )}
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile
          ? "var(--spacing-section) var(--spacing-md)"
          : "var(--spacing-section) var(--spacing-xxl)",
        gap: "var(--spacing-xxl)",
      }}
    >
      {/* Inner content block — max-width constrained */}
      <div
        style={{
          width: "100%",
          maxWidth: 840,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--spacing-xxl)",
          textAlign: "center",
        }}
      >
        {/* Brand wordmark */}
        <AvoloLogo height={28} />

        {/* Headings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
          <h1
            style={{
              fontSize: scale.hero,
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: scale.heroTracking,
              fontFamily: "var(--font-editorial), 'Playfair Display', serif",
              color: "var(--color-ink)",
              margin: 0,
            }}
          >
            Come fly with us ♬
          </h1>
          <p
            style={{
              fontSize:   isMobile ? 15 : 18,
              fontWeight: 400,
              lineHeight: 1.5,
              fontFamily: "var(--font-inter)",
              color:      "var(--color-stone)",
              margin:     0,
            }}
          >
            {firstName
              ? `Hi ${firstName}. Tell us about your travel plans.`
              : "Tell us about your travel plans."}
          </p>
        </div>

        {/* Conversational input */}
        <div style={{ width: "100%", textAlign: "left" }}>
          <HomeInput
            onAiError={(providers) => {
              setAiErrorProviders(providers);
              setAiModalDismissed(false);
            }}
          />
          <p
            style={{
              ...t.caption,
              color: "var(--color-muted)",
              margin: "var(--spacing-sm) 0 0",
              textAlign: "center",
            }}
          >
            Avolo can make mistakes. Verify important travel details.
          </p>
        </div>

        {/* Quick-action chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-sm)",
            flexWrap: "wrap",
          }}
        >
          {CHIPS.map((c) => (
            <Chip key={c.label} label={c.label} icon={c.icon} href={c.href} />
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
