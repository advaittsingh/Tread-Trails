import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify } from "@/lib/slugify";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

type MakeOption = { id: string; name: string; slug: string };

type ModelRow = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  makeId: string;
  make: MakeOption;
  _count: { vehicles: number };
};

type ModelsResponse = { models: ModelRow[] };
type MakesResponse = { makes: MakeOption[] };

const emptyForm = { makeId: "", name: "", slug: "", sortOrder: "0" };

export default function VehicleModelsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [makeFilter, setMakeFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ModelRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const makesQ = useAdminQuery<MakesResponse>("/api/admin/vehicle-makes");
  const q = useAdminQuery<ModelsResponse>("/api/admin/vehicle-models", {
    search: search || undefined,
    makeId: makeFilter === "all" ? undefined : makeFilter,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) {
        return apiFetchJson(`/api/admin/vehicle-models/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name.trim(),
            slug: form.slug.trim(),
            sortOrder: Number(form.sortOrder) || 0,
          }),
        });
      }
      return apiFetchJson("/api/admin/vehicle-models", {
        method: "POST",
        body: JSON.stringify({
          makeId: form.makeId,
          name: form.name.trim(),
          slug: form.slug.trim(),
          sortOrder: Number(form.sortOrder) || 0,
        }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast({ title: editing ? "Model updated" : "Model created" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiFetchJson(`/api/admin/vehicle-models/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Model deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const rows = (q.data?.models ?? []).map((m) => ({
    ...m,
    makeName: m.make.name,
    vehiclesCount: m._count.vehicles,
  }));

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      makeId: makeFilter !== "all" ? makeFilter : makesQ.data?.makes[0]?.id ?? "",
    });
    setOpen(true);
  };

  const openEdit = (model: ModelRow) => {
    setEditing(model);
    setForm({
      makeId: model.makeId,
      name: model.name,
      slug: model.slug,
      sortOrder: String(model.sortOrder),
    });
    setOpen(true);
  };

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4 flex flex-wrap gap-3 justify-between">
        <div className="flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            placeholder="Search models…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={makeFilter} onValueChange={setMakeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All makes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All makes</SelectItem>
              {(makesQ.data?.makes ?? []).map((mk) => (
                <SelectItem key={mk.id} value={mk.id}>
                  {mk.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openCreate} disabled={!makesQ.data?.makes.length}>
          <Plus className="h-4 w-4 mr-1" />
          Add model
        </Button>
      </CardContent>

      <AdminDataTable
        rows={rows}
        columns={[
          { key: "makeName", label: "Make" },
          { key: "name", label: "Model" },
          { key: "slug", label: "Slug" },
          { key: "sortOrder", label: "Sort" },
          { key: "vehiclesCount", label: "Platforms" },
        ]}
        emptyText={q.isLoading ? "Loading…" : "No models yet."}
        onRowClick={(row) => {
          const model = q.data?.models.find((m) => m.id === row.id);
          if (model) openEdit(model);
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit model" : "New model"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editing ? (
              <div className="space-y-1">
                <Label>Make</Label>
                <Select value={form.makeId} onValueChange={(v) => setForm((f) => ({ ...f, makeId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    {(makesQ.data?.makes ?? []).map((mk) => (
                      <SelectItem key={mk.id} value={mk.id}>
                        {mk.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1">
              <Label htmlFor="model-name">Name</Label>
              <Input
                id="model-name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editing ? f.slug : slugify(name),
                  }));
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="model-slug">Slug</Label>
              <Input
                id="model-slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="model-sort">Sort order</Label>
              <Input
                id="model-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              disabled={
                !form.name.trim() ||
                !form.slug.trim() ||
                (!editing && !form.makeId) ||
                saveMut.isPending
              }
              onClick={() => saveMut.mutate()}
            >
              Save
            </Button>
            {editing ? (
              <Button
                variant="destructive"
                className="w-full"
                disabled={deleteMut.isPending}
                onClick={() => {
                  if (window.confirm(`Delete model "${editing.name}"?`)) {
                    deleteMut.mutate(editing.id);
                    setOpen(false);
                  }
                }}
              >
                Delete model
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {q.error ? (
        <div className="px-3 lg:px-6 pb-6 text-sm text-red-700">
          {(q.error as Error).message}
        </div>
      ) : null}
    </>
  );
}
