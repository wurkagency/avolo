"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

interface MicButtonProps {
  onTranscript?: (text: string) => void;
  className?: string;
}

export function MicButton({ onTranscript, className }: MicButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  // Detect support client-side only to avoid hydration mismatch
  useEffect(() => {
    setSupported(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    );
  }, []);

  const startListening = useCallback(() => {
    if (!supported || listening) return;

    const SpeechRecognitionClass =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass() as SpeechRecognitionInstance;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript && onTranscript) {
        onTranscript(transcript.trim());
      }
    };

    recognition.start();
  }, [supported, listening, onTranscript]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={startListening}
      disabled={listening}
      className={cn(
        "flex items-center gap-2 text-steel hover:text-primary transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded",
        "disabled:opacity-60",
        className,
      )}
      aria-label={listening ? "Listening…" : "Tell me about your dream trip — voice input"}
    >
      <span
        className={cn("material-symbols-outlined", listening && "text-primary")}
        style={{
          fontSize: "28px",
          fontVariationSettings: listening ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400",
        }}
        aria-hidden="true"
      >
        mic
      </span>
      <span style={{ fontFamily: "var(--font-inter)", fontSize: "16px" }}>
        {listening ? "Listening…" : "Tell me about your dream trip."}
      </span>
    </button>
  );
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
}

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
