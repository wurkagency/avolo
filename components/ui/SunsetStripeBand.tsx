export function SunsetStripeBand() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: "var(--spacing-lg)",
        background: "linear-gradient(to right, var(--color-primary), var(--color-sunshine-700), var(--color-sunshine-500), var(--color-yellow-saturated), var(--color-cream))",
        flexShrink: 0,
      }}
    />
  );
}
