import { Button } from "@/components/ui/button";

type AdminPaginationBarProps = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Lowercase plural noun, e.g. "orders" */
  nounPlural: string;
};

export function AdminPaginationBar({
  total,
  page,
  limit,
  totalPages,
  loading,
  onPrev,
  onNext,
  nounPlural,
}: AdminPaginationBarProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 px-4 py-4">
      <p className="text-xs text-zinc-500">
        <span className="tabular-nums text-zinc-400">
          {start.toLocaleString("en-IN")}–{end.toLocaleString("en-IN")}
        </span>{" "}
        of {total.toLocaleString("en-IN")} {nounPlural} · page{" "}
        <span className="tabular-nums text-zinc-400">
          {page} / {totalPages}
        </span>
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-zinc-700 bg-zinc-900 text-zinc-200"
          disabled={page <= 1 || loading}
          onClick={onPrev}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-zinc-700 bg-zinc-900 text-zinc-200"
          disabled={page >= totalPages || loading}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
