interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, accent = false }: Props) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface p-5">
      <p className="text-xs font-medium text-steel uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold leading-none ${accent ? "text-primary" : "text-ink"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-steel mt-1">{sub}</p>}
    </div>
  );
}
