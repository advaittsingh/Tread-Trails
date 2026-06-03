import { useMemo, useState } from "react";
import { useAdminQuery } from "@/api/admin";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = { id: string; slug: string; name: string };
type TreeNode = {
  make: { id: string; slug: string; name: string };
  models: Array<{
    model: { id: string; slug: string; name: string };
    vehicles: Platform[];
  }>;
};
type TreeResponse = { tree: TreeNode[]; unassigned: Platform[] };

export function VehicleTreeSelector({
  selectedSlugs,
  onChange,
  maxHeight = 280,
}: {
  selectedSlugs: string[];
  onChange: (slugs: string[]) => void;
  maxHeight?: number;
}) {
  const q = useAdminQuery<TreeResponse>("/api/admin/vehicles/tree");
  const [query, setQuery] = useState("");
  const [expandedMakes, setExpandedMakes] = useState<Set<string>>(new Set());

  const allVehicles = useMemo(() => {
    const list: Platform[] = [...(q.data?.unassigned ?? [])];
    for (const make of q.data?.tree ?? []) {
      for (const m of make.models) {
        list.push(...m.vehicles);
      }
    }
    return list;
  }, [q.data]);

  const filtered = useMemo(() => {
    const qn = query.trim().toLowerCase();
    if (!qn) return allVehicles;
    return allVehicles.filter(
      (v) =>
        v.name.toLowerCase().includes(qn) ||
        v.slug.toLowerCase().includes(qn)
    );
  }, [allVehicles, query]);

  const toggle = (slug: string) => {
    if (selectedSlugs.includes(slug)) {
      onChange(selectedSlugs.filter((s) => s !== slug));
    } else {
      onChange([...selectedSlugs, slug].slice(0, 32));
    }
  };

  const coverage =
    allVehicles.length > 0
      ? Math.round((selectedSlugs.length / allVehicles.length) * 100)
      : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-stone-600">
        <span>
          {selectedSlugs.length} vehicle(s) selected
          {allVehicles.length > 0 && ` · ${coverage}% of catalog`}
        </span>
        <button
          type="button"
          className="text-stone-800 underline"
          onClick={() => onChange([])}
        >
          Clear
        </button>
      </div>
      <Input
        className="h-8 text-sm"
        placeholder="Search vehicles…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ScrollArea style={{ maxHeight }} className="rounded-md border border-stone-200">
        <div className="p-2 space-y-1">
          {query ? (
            filtered.map((v) => (
              <label
                key={v.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-stone-50 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={selectedSlugs.includes(v.slug)}
                  onCheckedChange={() => toggle(v.slug)}
                />
                <span>{v.name}</span>
                <span className="text-[10px] text-stone-400 ml-auto">{v.slug}</span>
              </label>
            ))
          ) : (
            (q.data?.tree ?? []).map((make) => {
              const open = expandedMakes.has(make.make.id);
              return (
                <div key={make.make.id}>
                  <button
                    type="button"
                    className="flex items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 rounded"
                    onClick={() => {
                      const next = new Set(expandedMakes);
                      if (open) next.delete(make.make.id);
                      else next.add(make.make.id);
                      setExpandedMakes(next);
                    }}
                  >
                    {open ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    {make.make.name}
                  </button>
                  {open &&
                    make.models.map((m) => (
                      <div key={m.model.id} className="pl-4">
                        <p className="text-[10px] uppercase tracking-wide text-stone-400 px-2 py-0.5">
                          {m.model.name}
                        </p>
                        {m.vehicles.map((v) => (
                          <label
                            key={v.id}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1 rounded hover:bg-stone-50 text-sm cursor-pointer"
                            )}
                          >
                            <Checkbox
                              checked={selectedSlugs.includes(v.slug)}
                              onCheckedChange={() => toggle(v.slug)}
                            />
                            {v.name}
                          </label>
                        ))}
                      </div>
                    ))}
                </div>
              );
            })
          )}
          {(q.data?.unassigned?.length ?? 0) > 0 && !query && (
            <div className="pt-2 border-t border-stone-100">
              <p className="text-[10px] uppercase text-stone-400 px-2 mb-1">
                Unassigned
              </p>
              {q.data!.unassigned.map((v) => (
                <label
                  key={v.id}
                  className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-stone-50 rounded"
                >
                  <Checkbox
                    checked={selectedSlugs.includes(v.slug)}
                    onCheckedChange={() => toggle(v.slug)}
                  />
                  {v.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      {selectedSlugs.length === 0 && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
          Fitment validation: assign at least one vehicle before publishing.
        </p>
      )}
      {selectedSlugs.length > 0 && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5">
          Fitment mapped for {selectedSlugs.length} platform(s).
        </p>
      )}
    </div>
  );
}
