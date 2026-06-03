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
import { slugify } from "@/lib/slugify";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

type MakeRow = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  _count: { models: number };
};

type MakesResponse = {
  makes: MakeRow[];
};

const emptyForm = { name: "", slug: "", sortOrder: "0" };

export default function VehicleMakesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MakeRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const q = useAdminQuery<MakesResponse>("/api/admin/vehicle-makes", {
    search: search || undefined,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editing) {
        return apiFetchJson(`/api/admin/vehicle-makes/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      return apiFetchJson("/api/admin/vehicle-makes", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast({ title: editing ? "Make updated" : "Make created" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiFetchJson(`/api/admin/vehicle-makes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Make deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const rows = (q.data?.makes ?? []).map((m) => ({
    ...m,
    modelsCount: m._count.models,
  }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (make: MakeRow) => {
    setEditing(make);
    setForm({
      name: make.name,
      slug: make.slug,
      sortOrder: String(make.sortOrder),
    });
    setOpen(true);
  };

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4 flex flex-wrap gap-3 justify-between">
        <Input
          className="max-w-xs"
          placeholder="Search makes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add make
        </Button>
      </CardContent>

      <AdminDataTable
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "sortOrder", label: "Sort" },
          { key: "modelsCount", label: "Models" },
        ]}
        emptyText={q.isLoading ? "Loading…" : "No makes yet."}
        onRowClick={(row) => {
          const make = q.data?.makes.find((m) => m.id === row.id);
          if (make) openEdit(make);
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit make" : "New make"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="make-name">Name</Label>
              <Input
                id="make-name"
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
              <Label htmlFor="make-slug">Slug</Label>
              <Input
                id="make-slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="make-sort">Sort order</Label>
              <Input
                id="make-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              disabled={!form.name.trim() || !form.slug.trim() || saveMut.isPending}
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
                  if (window.confirm(`Delete make "${editing.name}"?`)) {
                    deleteMut.mutate(editing.id);
                    setOpen(false);
                  }
                }}
              >
                Delete make
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
