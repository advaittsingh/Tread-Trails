import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Build = {
  id: string;
  slug: string;
  title: string;
  vehicleSlug: string;
  summary: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  gallery: string[];
  productIds: string[];
};

type BuildRow = {
  id: string;
  legacyId: string | null;
  build: Build;
};

type BuildsResponse = {
  builds: BuildRow[];
  total: number;
  page: number;
  totalPages: number;
};

const emptyForm = {
  slug: "",
  title: "",
  vehicleSlug: "",
  summary: "",
  description: "",
  beforeImage: "",
  afterImage: "",
  gallery: "",
  productIds: "",
};

export default function PortfolioBuildsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BuildRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const q = useAdminQuery<BuildsResponse>("/api/admin/portfolio-builds", {
    page,
    limit: 25,
    search: search || undefined,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        slug: form.slug,
        title: form.title,
        vehicleSlug: form.vehicleSlug,
        summary: form.summary,
        description: form.description,
        beforeImage: form.beforeImage,
        afterImage: form.afterImage,
        gallery: form.gallery
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        productIds: form.productIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editing) {
        return apiFetchJson(`/api/admin/portfolio-builds/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      return apiFetchJson("/api/admin/portfolio-builds", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast({ title: editing ? "Build updated" : "Build created" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiFetchJson(`/api/admin/portfolio-builds/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Build deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row: BuildRow) => {
    setEditing(row);
    setForm({
      slug: row.build.slug,
      title: row.build.title,
      vehicleSlug: row.build.vehicleSlug,
      summary: row.build.summary,
      description: row.build.description,
      beforeImage: row.build.beforeImage,
      afterImage: row.build.afterImage,
      gallery: row.build.gallery.join("\n"),
      productIds: row.build.productIds.join(", "),
    });
    setDialogOpen(true);
  };

  const tableRows = (q.data?.builds ?? []).map((row) => ({
    id: row.id,
    title: row.build.title,
    slug: row.build.slug,
    vehicleSlug: row.build.vehicleSlug,
    products: row.build.productIds.length,
    gallery: row.build.gallery.length,
  }));

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4">
        <div className="flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            placeholder="Search builds…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Button size="sm" onClick={openCreate}>Create build</Button>
        </div>
      </CardContent>

      <AdminDataTable
        rows={tableRows}
        columns={[
          { key: "title", label: "Title" },
          { key: "slug", label: "Slug" },
          { key: "vehicleSlug", label: "Vehicle" },
          { key: "products", label: "Products" },
          { key: "gallery", label: "Gallery" },
        ]}
        emptyText={q.isLoading ? "Loading…" : "No builds."}
      />

      <CardContent className="px-3 lg:px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {(q.data?.builds ?? []).map((row) => (
            <div key={row.id} className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                Edit {row.build.title}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm("Delete this build?")) deleteMut.mutate(row.id);
                }}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      {q.data ? (
        <AdminPagination
          page={q.data.page}
          totalPages={q.data.totalPages}
          total={q.data.total}
          onPageChange={setPage}
        />
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit build" : "Create build"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <Label>Vehicle slug</Label>
              <Input value={form.vehicleSlug} onChange={(e) => setForm({ ...form, vehicleSlug: e.target.value })} />
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div>
              <Label>Before image URL</Label>
              <Input value={form.beforeImage} onChange={(e) => setForm({ ...form, beforeImage: e.target.value })} />
            </div>
            <div>
              <Label>After image URL</Label>
              <Input value={form.afterImage} onChange={(e) => setForm({ ...form, afterImage: e.target.value })} />
            </div>
            <div>
              <Label>Gallery URLs (one per line)</Label>
              <Textarea value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Product IDs (comma-separated slugs or IDs)</Label>
              <Input value={form.productIds} onChange={(e) => setForm({ ...form, productIds: e.target.value })} />
            </div>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {editing ? "Save changes" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
