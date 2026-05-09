import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  user: "border-zinc-600/60 bg-zinc-800/90 text-zinc-200 ring-zinc-600/30",
  admin:
    "border-amber-500/45 bg-amber-500/15 text-amber-100 ring-amber-500/25",
  pending:
    "border-amber-500/40 bg-amber-500/15 text-amber-200 ring-amber-500/20",
  paid: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 ring-emerald-500/20",
  shipped: "border-sky-500/40 bg-sky-500/15 text-sky-200 ring-sky-500/20",
  cancelled:
    "border-rose-500/40 bg-rose-500/15 text-rose-200 ring-rose-500/20",
  requested:
    "border-violet-500/40 bg-violet-500/15 text-violet-200 ring-violet-500/20",
  confirmed:
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 ring-emerald-500/20",
};

export function AdminStatusBadge({ status }: { status: string }) {
  const cls = map[status] ?? "border-zinc-600 bg-zinc-800 text-zinc-200";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize tracking-wide ring-1 ring-inset",
        cls
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
