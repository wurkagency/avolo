const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(iso: string | Date | null): string {
  if (!iso) return "Never";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diffSec = (date.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diffSec);

  if (abs < 60) return rtf.format(Math.round(diffSec), "seconds");
  if (abs < 3_600) return rtf.format(Math.round(diffSec / 60), "minutes");
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3_600), "hours");
  if (abs < 2_592_000) return rtf.format(Math.round(diffSec / 86_400), "days");
  if (abs < 31_536_000) return rtf.format(Math.round(diffSec / 2_592_000), "months");
  return rtf.format(Math.round(diffSec / 31_536_000), "years");
}
