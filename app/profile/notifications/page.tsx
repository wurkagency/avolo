"use client";

import { useState, useEffect } from "react";
import { useUiStore } from "@/lib/state/uiStore";

interface NotificationSettings {
  priceDropAlerts: boolean;
  tripUpdates: boolean;
  systemEmails: boolean;
}

const ITEMS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  {
    key: "priceDropAlerts",
    label: "Price drop alerts",
    description: "Get notified when prices on your saved trips drop significantly.",
  },
  {
    key: "tripUpdates",
    label: "Trip updates",
    description: "Receive updates about changes affecting your upcoming trips.",
  },
  {
    key: "systemEmails",
    label: "System emails",
    description: "Account-related emails such as login links and data export confirmations.",
  },
];

async function patchNotification(key: string, value: boolean) {
  const res = await fetch("/api/profile/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [key]: value }),
  });
  if (!res.ok) throw new Error("Failed to update notification setting");
}

export default function NotificationsPage() {
  const addToast = useUiStore((s) => s.addToast);
  const [settings, setSettings] = useState<NotificationSettings>({
    priceDropAlerts: true,
    tripUpdates: true,
    systemEmails: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile/notifications")
      .then((r) => r.json())
      .then((data: Partial<NotificationSettings>) => setSettings((prev) => ({ ...prev, ...data })))
      .catch(() => addToast("Could not load notification settings", "error"))
      .finally(() => setLoading(false));
  }, [addToast]);

  async function handleToggle(key: keyof NotificationSettings) {
    const newValue = !settings[key];
    // Optimistic update
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    setSaving(key);
    try {
      await patchNotification(key, newValue);
    } catch {
      // Revert on failure
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      addToast("Could not save notification setting", "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: "var(--font-editorial)" }}>
          Notifications
        </h1>
        <p className="text-sm text-steel mt-1">Manage which emails you receive from Avolo.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-8 text-steel">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading…</span>
        </div>
      ) : (
        <section className="flex flex-col divide-y divide-hairline rounded-lg border border-hairline overflow-hidden">
          {ITEMS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="text-xs text-steel mt-0.5">{description}</p>
              </div>

              {/* Toggle switch */}
              <button
                role="switch"
                aria-checked={settings[key]}
                aria-label={label}
                onClick={() => void handleToggle(key)}
                disabled={saving === key}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 ${
                  settings[key] ? "bg-primary" : "bg-surface"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                    settings[key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
