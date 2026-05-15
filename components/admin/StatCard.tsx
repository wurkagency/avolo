interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, accent = false }: Props) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-outline-variant bg-surface p-5">
      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold leading-none ${accent ? "text-primary" : "text-on-surface"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
    </div>
  );
}
