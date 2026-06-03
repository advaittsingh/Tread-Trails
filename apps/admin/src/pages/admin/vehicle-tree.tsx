import { useEffect, useState, type DragEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";

type Platform = { id: string; slug: string; name: string; category: string };

type TreeNode = {
  make: { id: string; slug: string; name: string };
  models: Array<{
    model: { id: string; slug: string; name: string };
    vehicles: Platform[];
  }>;
};

type TreeResponse = {
  tree: TreeNode[];
  unassigned: Platform[];
};

type DragState = {
  level: "make" | "model" | "vehicle";
  parentId: string | null;
  index: number;
};

function reorder<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item === undefined) return list;
  next.splice(to, 0, item);
  return next;
}

export default function VehicleTreePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const q = useAdminQuery<TreeResponse>("/api/admin/vehicles/tree");

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [unassigned, setUnassigned] = useState<Platform[]>([]);
  const [expandedMakes, setExpandedMakes] = useState<Set<string>>(new Set());
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    if (!q.data) return;
    setTree(q.data.tree);
    setUnassigned(q.data.unassigned);
    setExpandedMakes(new Set(q.data.tree.map((n) => n.make.id)));
  }, [q.data]);

  const reorderMut = useMutation({
    mutationFn: (body: {
      level: "make" | "model" | "vehicle";
      parentId?: string | null;
      orderedIds: string[];
    }) =>
      apiFetchJson("/api/admin/vehicles/tree/reorder", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Order saved" });
    },
    onError: (e: Error) =>
      toast({ title: "Reorder failed", description: e.message, variant: "destructive" }),
  });

  const backfillMut = useMutation({
    mutationFn: () => apiFetchJson("/api/admin/vehicles/backfill", { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Hierarchy backfill complete" });
    },
    onError: (e: Error) =>
      toast({ title: "Backfill failed", description: e.message, variant: "destructive" }),
  });

  const commitReorder = (
    level: DragState["level"],
    parentId: string | null,
    toIndex: number,
    orderedIds: string[],
    apply: () => void
  ) => {
    if (!drag || drag.level !== level || drag.parentId !== parentId) return;
    if (drag.index === toIndex) {
      setDrag(null);
      return;
    }
    apply();
    reorderMut.mutate({ level, parentId, orderedIds });
    setDrag(null);
  };

  const rowProps = (state: DragState) => ({
    draggable: true,
    onDragStart: () => setDrag(state),
    onDragEnd: () => setDrag(null),
    onDragOver: (e: DragEvent) => e.preventDefault(),
  });

  if (q.isLoading) {
    return (
      <CardContent className="px-3 lg:px-6 pb-6">
        <p className="text-sm text-stone-600">Loading tree…</p>
      </CardContent>
    );
  }

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4 flex flex-wrap gap-3 justify-between">
        <p className="text-sm text-stone-600">
          Expand groups and drag rows to reorder makes, models, and platforms.
        </p>
        <Button
          variant="secondary"
          size="sm"
          disabled={backfillMut.isPending}
          onClick={() => backfillMut.mutate()}
        >
          Backfill from slugs
        </Button>
      </CardContent>

      <CardContent className="px-3 lg:px-6 pb-6 space-y-2">
        {tree.map((node, makeIndex) => {
          const makeOpen = expandedMakes.has(node.make.id);
          return (
            <div key={node.make.id} className="rounded-lg border border-stone-200 overflow-hidden">
              <div
                className="flex items-center gap-2 bg-stone-50 px-3 py-2"
                {...rowProps({ level: "make", parentId: null, index: makeIndex })}
                onDrop={() => {
                  if (!drag) return;
                  const next = reorder(tree, drag.index, makeIndex);
                  commitReorder("make", null, makeIndex, next.map((n) => n.make.id), () =>
                    setTree(next)
                  );
                }}
              >
                <GripVertical className="h-4 w-4 text-stone-400 shrink-0 cursor-grab" />
                <button type="button" className="p-0.5" onClick={() =>
                  setExpandedMakes((s) => {
                    const n = new Set(s);
                    n.has(node.make.id) ? n.delete(node.make.id) : n.add(node.make.id);
                    return n;
                  })
                }>
                  {makeOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <span className="font-semibold text-sm">{node.make.name}</span>
                <span className="text-xs text-stone-500 font-mono ml-auto">{node.make.slug}</span>
              </div>

              {makeOpen ? (
                <div className="pl-6 pb-2">
                  {node.models.map((group, modelIndex) => {
                    const modelOpen = expandedModels.has(group.model.id);
                    return (
                      <div key={group.model.id} className="mt-1">
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-stone-50"
                          {...rowProps({
                            level: "model",
                            parentId: node.make.id,
                            index: modelIndex,
                          })}
                          onDrop={() => {
                            if (!drag) return;
                            const nextModels = reorder(node.models, drag.index, modelIndex);
                            commitReorder(
                              "model",
                              node.make.id,
                              modelIndex,
                              nextModels.map((m) => m.model.id),
                              () =>
                                setTree((prev) =>
                                  prev.map((mk) =>
                                    mk.make.id === node.make.id
                                      ? { ...mk, models: nextModels }
                                      : mk
                                  )
                                )
                            );
                          }}
                        >
                          <GripVertical className="h-3.5 w-3.5 text-stone-400 cursor-grab" />
                          <button type="button" className="p-0.5" onClick={() =>
                            setExpandedModels((s) => {
                              const n = new Set(s);
                              n.has(group.model.id) ? n.delete(group.model.id) : n.add(group.model.id);
                              return n;
                            })
                          }>
                            {modelOpen ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <span className="text-sm font-medium">{group.model.name}</span>
                          <span className="text-xs text-stone-400 ml-auto">
                            {group.vehicles.length} platform{group.vehicles.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        {modelOpen ? (
                          <div className="pl-8">
                            {group.vehicles.map((vehicle, vehicleIndex) => (
                              <div
                                key={vehicle.id}
                                className="flex items-center gap-2 px-3 py-1 text-sm rounded-md hover:bg-stone-50"
                                {...rowProps({
                                  level: "vehicle",
                                  parentId: group.model.id,
                                  index: vehicleIndex,
                                })}
                                onDrop={() => {
                                  if (!drag) return;
                                  const nextVehicles = reorder(
                                    group.vehicles,
                                    drag.index,
                                    vehicleIndex
                                  );
                                  commitReorder(
                                    "vehicle",
                                    group.model.id,
                                    vehicleIndex,
                                    nextVehicles.map((v) => v.id),
                                    () =>
                                      setTree((prev) =>
                                        prev.map((mk) =>
                                          mk.make.id !== node.make.id
                                            ? mk
                                            : {
                                                ...mk,
                                                models: mk.models.map((md) =>
                                                  md.model.id !== group.model.id
                                                    ? md
                                                    : { ...md, vehicles: nextVehicles }
                                                ),
                                              }
                                        )
                                      )
                                  );
                                }}
                              >
                                <GripVertical className="h-3.5 w-3.5 text-stone-300 cursor-grab" />
                                <span>{vehicle.name}</span>
                                <span className="text-xs text-stone-400 font-mono ml-auto">
                                  {vehicle.slug}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}

        {unassigned.length > 0 ? (
          <section className="mt-6 rounded-lg border border-dashed border-stone-300 p-4">
            <h2 className="text-sm font-semibold mb-2">Unassigned platforms</h2>
            {unassigned.map((vehicle, vehicleIndex) => (
              <div
                key={vehicle.id}
                className="flex items-center gap-2 px-3 py-1 text-sm rounded-md hover:bg-stone-50"
                {...rowProps({ level: "vehicle", parentId: null, index: vehicleIndex })}
                onDrop={() => {
                  if (!drag) return;
                  const next = reorder(unassigned, drag.index, vehicleIndex);
                  commitReorder("vehicle", null, vehicleIndex, next.map((v) => v.id), () =>
                    setUnassigned(next)
                  );
                }}
              >
                <GripVertical className="h-3.5 w-3.5 text-stone-300 cursor-grab" />
                <span>{vehicle.name}</span>
                <span className="text-xs text-stone-400 font-mono ml-auto">{vehicle.slug}</span>
              </div>
            ))}
          </section>
        ) : null}
      </CardContent>

      {q.error ? (
        <div className="px-3 lg:px-6 pb-6 text-sm text-red-700">
          {(q.error as Error).message}
        </div>
      ) : null}
    </>
  );
}
