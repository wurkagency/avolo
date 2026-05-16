"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { useUserStore } from "@/lib/state/userStore";
import { useUiStore } from "@/lib/state/uiStore";
import { Modal } from "@/components/ui/Modal";

type Currency = "EUR" | "USD" | "GBP" | "DKK" | "SEK" | "NOK";
type Language = "EN" | "DE" | "DA" | "SV" | "NO";

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "EUR", label: "Euro (€)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "DKK", label: "Danish Krone (kr)" },
  { value: "SEK", label: "Swedish Krona (kr)" },
  { value: "NOK", label: "Norwegian Krone (kr)" },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "EN", label: "English" },
  { value: "DE", label: "Deutsch" },
  { value: "DA", label: "Dansk" },
  { value: "SV", label: "Svenska" },
  { value: "NO", label: "Norsk" },
];

async function patchProfile(data: Record<string, unknown>) {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Update failed" })) as { error?: string };
    throw new Error(body.error ?? "Update failed");
  }
  return res.json();
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { setCurrency, setLanguage, currency: storeCurrency, language: storeLanguage } = useUserStore();
  const addToast = useUiStore((s) => s.addToast);

  const [name, setName] = useState(session?.user?.name ?? "");
  const [currency, setCurrencyLocal] = useState<Currency>((session?.user as { currency?: string })?.currency as Currency ?? storeCurrency);
  const [language, setLanguageLocal] = useState<Language>((session?.user as { language?: string })?.language as Language ?? storeLanguage);

  const [savingName, setSavingName] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Sync name from session when it loads
  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  async function saveName() {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await patchProfile({ name: name.trim() });
      await updateSession({ name: name.trim() });
      addToast("Name updated", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save name", "error");
    } finally {
      setSavingName(false);
    }
  }

  async function handleCurrencyChange(c: Currency) {
    setCurrencyLocal(c);
    try {
      await patchProfile({ currency: c });
      // Update JWT token so next session read reflects new currency
      await updateSession({ currency: c });
      // Update Zustand immediately for instant price re-renders
      setCurrency(c);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save currency", "error");
    }
  }

  async function handleLanguageChange(l: Language) {
    setLanguageLocal(l);
    try {
      await patchProfile({ language: l });
      await updateSession({ language: l });
      setLanguage(l);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save language", "error");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/profile/export", { method: "POST" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `avolo-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deleteEmail.trim()) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deleteEmail.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Deletion failed" })) as { error?: string };
        throw new Error(body.error ?? "Deletion failed");
      }
      // Sign out and redirect to home — session is now invalid
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Deletion failed", "error");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: "var(--font-editorial)" }}>
          Account settings
        </h1>
        <p className="text-sm text-steel mt-1">{session?.user?.email}</p>
      </div>

      {/* Name */}
      <section className="flex flex-col gap-4 rounded-lg border border-hairline p-6">
        <h2 className="text-base font-semibold text-ink">Display name</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void saveName()}
            maxLength={100}
            placeholder="Your name"
            className="flex-1 rounded-xl border border-hairline bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-steel focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={saveName}
            disabled={savingName || !name.trim()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {savingName ? "Saving…" : "Save"}
          </button>
        </div>
      </section>

      {/* Currency & Language */}
      <section className="flex flex-col gap-4 rounded-lg border border-hairline p-6">
        <h2 className="text-base font-semibold text-ink">Display preferences</h2>
        <p className="text-sm text-steel -mt-1">Changes apply immediately across all prices.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-steel uppercase tracking-wide">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => void handleCurrencyChange(e.target.value as Currency)}
              className="rounded-xl border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-steel uppercase tracking-wide">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => void handleLanguageChange(e.target.value as Language)}
              className="rounded-xl border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* GDPR */}
      <section className="flex flex-col gap-4 rounded-lg border border-hairline p-6">
        <h2 className="text-base font-semibold text-ink">Your data</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl border border-hairline px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">download</span>
            {exporting ? "Exporting…" : "Export my data"}
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">delete_forever</span>
            Delete my account
          </button>
        </div>

        <p className="text-xs text-steel">
          Exporting gives you a JSON file with all your data. Deleting is permanent and cannot be undone.
        </p>
      </section>

      {/* Delete confirmation modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete account?">
        <p className="text-sm text-steel mb-4">
          This permanently deletes your account and all associated data — trips, preferences, and search history.
          <strong className="text-red-600"> This cannot be undone.</strong>
        </p>
        <p className="text-sm text-ink mb-3">
          Type your email address to confirm: <strong>{session?.user?.email}</strong>
        </p>
        <input
          type="email"
          value={deleteEmail}
          onChange={(e) => setDeleteEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="off"
          className="w-full rounded-xl border border-hairline bg-surface px-4 py-2.5 text-sm text-ink mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="rounded-md border border-hairline px-5 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting || deleteEmail.trim().toLowerCase() !== session?.user?.email?.toLowerCase()}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
