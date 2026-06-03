export function formatInr(amount: number, opts?: { compact?: boolean }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: opts?.compact && amount >= 100_000 ? "compact" : "standard",
  }).format(amount);
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatChartDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
