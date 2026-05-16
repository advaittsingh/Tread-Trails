"use client";

import { useCallback, useEffect, useState } from "react";
import { PackageSearch } from "lucide-react";

import type {
  Product,
  ProductSpecification,
  ProductVariant,
} from "@/data/types";
import { useConfirmation } from "@/contexts/confirmation-context";
import { formatInr } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import {
  AdminEditSheet,
  AdminField,
  AdminFieldGrid,
  AdminFormSection,
  AdminFormStack,
  AdminPageHeader,
  AdminSheetFooterButtons,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/admin-edit-sheet";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type ProductDto = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price?: number;
  currency?: string;
  compatibleCars: string[];
};

type ListRow = {
  id: string;
  product: ProductDto;
};

type VariantFormRow = {
  id: string;
  label: string;
  /** Whole INR delta vs base price; blank omits `priceModifier`. */
  priceModifierStr: string;
};

function parseVehicleSlugs(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function emptyForm() {
  return {
    slug: "",
    name: "",
    brand: "",
    category: "",
    priceStr: "",
    currency: "INR",
    description: "",
    legacyId: "",
    vehicleSlugsStr: "",
    imagesStr: "",
    specs: [] as ProductSpecification[],
    variantRows: [] as VariantFormRow[],
  };
}

/** Rows must have both fields set to be persisted (draft blanks are dropped). */
function specsPayload(rows: ProductSpecification[]): ProductSpecification[] {
  return rows
    .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
    .filter((s) => s.label !== "" && s.value !== "");
}

function variantsPayload(
  rows: VariantFormRow[]
):
  | { ok: true; variants: ProductVariant[] }
  | { ok: false; message: string } {
  const out: ProductVariant[] = [];
  for (const r of rows) {
    const id = r.id.trim();
    const label = r.label.trim();
    const pmTrim = r.priceModifierStr.trim();
    if (id === "" && label === "" && pmTrim === "") continue;
    if (id === "" || label === "") {
      return {
        ok: false,
        message:
          "Each variant row needs both ID and label, or remove incomplete rows.",
      };
    }
    let priceModifier: number | undefined;
    if (pmTrim !== "") {
      const n = Number.parseInt(pmTrim, 10);
      if (Number.isNaN(n)) {
        return {
          ok: false,
          message:
            "Variant price modifier must be a whole number (same units as price), or leave blank.",
        };
      }
      priceModifier = n;
    }
    const row: ProductVariant = { id, label };
    if (priceModifier !== undefined) row.priceModifier = priceModifier;
    out.push(row);
  }
  return { ok: true, variants: out };
}

export function AdminProductsTable() {
  const { confirmDelete } = useConfirmation();
  const [rows, setRows] = useState<ListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [brandDraft, setBrandDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingInternalId, setEditingInternalId] = useState<string | null>(
    null
  );
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) qs.set("search", search.trim());
      if (brandFilter.trim()) qs.set("brand", brandFilter.trim());
      if (categoryFilter.trim()) qs.set("category", categoryFilter.trim());

      const res = await fetch(`/api/admin/products?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load products");
      setRows(data.products as ListRow[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setRows([]);
      toastError("Could not load products", msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, brandFilter, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchDraft);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setBrandFilter(brandDraft.trim());
      setCategoryFilter(categoryDraft.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [brandDraft, categoryDraft]);

  function openCreate() {
    setEditingInternalId(null);
    setForm(emptyForm());
    setFormError(null);
    setSheetOpen(true);
  }

  async function openEdit(internalId: string) {
    setEditingInternalId(internalId);
    setFormError(null);
    setFormLoading(true);
    setSheetOpen(true);
    try {
      const res = await fetch(`/api/admin/products/${internalId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load product");
      const p = data.product as Product;
      setForm({
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        priceStr: p.price != null ? String(p.price) : "",
        currency: p.currency ?? "INR",
        description: p.description ?? "",
        legacyId: "",
        vehicleSlugsStr: (p.compatibleCars ?? []).join(", "),
        imagesStr: (p.images ?? []).join(", "),
        specs: Array.isArray(p.specs) ? p.specs.map((s) => ({ ...s })) : [],
        variantRows:
          p.variants?.map((v) => ({
            id: v.id,
            label: v.label,
            priceModifierStr:
              v.priceModifier != null ? String(v.priceModifier) : "",
          })) ?? [],
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Load failed");
      setForm(emptyForm());
    } finally {
      setFormLoading(false);
    }
  }

  async function saveProduct() {
    setSaving(true);
    setFormError(null);
    const vehicleSlugs = parseVehicleSlugs(form.vehicleSlugsStr);
    const images = form.imagesStr
      .split(/[,]\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    const priceTrim = form.priceStr.trim();
    const price =
      priceTrim === "" ? null : Number.parseInt(priceTrim, 10);
    if (priceTrim !== "" && (Number.isNaN(price!) || price! < 0)) {
      setFormError("Price must be a non‑negative integer (INR paise/whole as stored).");
      setSaving(false);
      return;
    }

    const specs = specsPayload(form.specs);
    const vp = variantsPayload(form.variantRows);
    if (!vp.ok) {
      setFormError(vp.message);
      setSaving(false);
      return;
    }
    const variants = vp.variants;

    try {
      if (editingInternalId) {
        const body: Record<string, unknown> = {
          slug: form.slug.trim(),
          name: form.name.trim(),
          brand: form.brand.trim(),
          category: form.category.trim(),
          currency: form.currency.trim() || "INR",
          description: form.description,
          images,
          specs,
          variants,
          vehicleSlugs,
        };
        if (form.legacyId.trim()) body.legacyId = form.legacyId.trim();
        body.price = price;

        const res = await fetch(`/api/admin/products/${editingInternalId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error ??
              data.detail ??
              (typeof data.details === "object"
                ? JSON.stringify(data.details)
                : "Update failed")
          );
        }
      } else {
        const body = {
          slug: form.slug.trim(),
          name: form.name.trim(),
          brand: form.brand.trim(),
          category: form.category.trim(),
          price,
          currency: form.currency.trim() || "INR",
          description: form.description,
          images,
          specs,
          variants,
          vehicleSlugs,
          ...(form.legacyId.trim()
            ? { legacyId: form.legacyId.trim() }
            : {}),
        };
        if (!body.slug || !body.name) {
          setFormError("Slug and name are required.");
          setSaving(false);
          return;
        }

        const res = await fetch(`/api/admin/products`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error ??
              data.detail ??
              (typeof data.details === "object"
                ? JSON.stringify(data.details)
                : "Create failed")
          );
        }
      }

      setSheetOpen(false);
      await load();
      toastSuccess(
        editingInternalId ? "Product updated" : "Product created",
        form.slug.trim()
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setFormError(msg);
      toastError("Could not save product", msg);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(internalId: string, slugLabel: string) {
    const confirmed = await confirmDelete({
      title: "Delete this product?",
      description:
        "Compatibility rows will be removed from Postgres. This cannot be undone.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!confirmed) return;

    setDeletingId(internalId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${internalId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      await load();
      toastSuccess("Product deleted", slugLabel);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      setError(msg);
      toastError("Delete failed", msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <AdminPageHeader
        title="Products"
        description="Catalog SKUs — pricing, fitment, specs, and checkout variants."
        action={
          <Button
            type="button"
            onClick={openCreate}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            New product
          </Button>
        }
      />

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-6">
        <div className="min-w-[220px] max-w-md flex-1 space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Search
          </Label>
          <Input
            placeholder="Slug, name, or brand…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <div className="min-w-[160px] max-w-[200px] space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Brand filter
          </Label>
          <Input
            placeholder="Contains…"
            value={brandDraft}
            onChange={(e) => setBrandDraft(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <div className="min-w-[160px] max-w-[200px] space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Category filter
          </Label>
          <Input
            placeholder="Contains…"
            value={categoryDraft}
            onChange={(e) => setCategoryDraft(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Vehicles</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4" colSpan={7}>
                        <Skeleton className="h-10 w-full rounded-lg bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/40">
                      <td className="max-w-[180px] truncate px-4 py-4 font-mono text-xs text-emerald-300/90">
                        {r.product.slug}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-4 text-zinc-100">
                        {r.product.name}
                      </td>
                      <td className="px-4 py-4 text-zinc-400">{r.product.brand}</td>
                      <td className="px-4 py-4 text-zinc-400">
                        {r.product.category}
                      </td>
                      <td className="px-4 py-4 tabular-nums text-zinc-200">
                        {r.product.price != null
                          ? formatInr(r.product.price) ?? "—"
                          : "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-4 text-xs text-zinc-500">
                        {(r.product.compatibleCars ?? []).length > 0
                          ? r.product.compatibleCars.join(", ")
                          : "—"}
                      </td>
                      <td className="space-x-2 whitespace-nowrap px-4 py-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-zinc-600 bg-zinc-950 text-zinc-200"
                          onClick={() => openEdit(r.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-rose-900/60 bg-zinc-950 text-rose-300 hover:bg-rose-950/40"
                          disabled={deletingId === r.id}
                          aria-label={`Delete product ${r.product.slug}`}
                          onClick={() => deleteProduct(r.id, r.product.slug)}
                        >
                          {deletingId === r.id ? "Deleting…" : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <AdminEmptyState
            icon={PackageSearch}
            title={
              search.trim() || brandFilter.trim() || categoryFilter.trim()
                ? "No products match these filters"
                : "No products yet"
            }
            description={
              search.trim() || brandFilter.trim() || categoryFilter.trim()
                ? "Try clearing search or brand/category filters."
                : "Use New product above to create the first SKU."
            }
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="SKUs"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

      <AdminEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editingInternalId ? "Edit product" : "New product"}
        subtitle="Published on the product detail page and in catalog search."
        formError={formError}
        loading={formLoading}
        loadingSkeleton={
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl bg-zinc-800" />
            <Skeleton className="h-24 w-full rounded-xl bg-zinc-800" />
          </div>
        }
        footer={
          <AdminSheetFooterButtons
            onCancel={() => setSheetOpen(false)}
            onSave={() => void saveProduct()}
            saving={saving}
            saveDisabled={formLoading}
          />
        }
      >
        <AdminFormStack>
          <AdminFormSection title="Basics" description="Slug, name, brand, and category.">
            <AdminFieldGrid>
              <AdminField label="URL slug" hint="Lowercase, hyphenated.">
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  className={adminInputClass}
                  placeholder="sku-slug"
                />
              </AdminField>
              <AdminField label="Name">
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={adminInputClass}
                />
              </AdminField>
            </AdminFieldGrid>
            <AdminFieldGrid>
              <AdminField label="Brand">
                <Input
                  value={form.brand}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand: e.target.value }))
                  }
                  className={adminInputClass}
                />
              </AdminField>
              <AdminField label="Category">
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className={adminInputClass}
                />
              </AdminField>
            </AdminFieldGrid>
          </AdminFormSection>

          <AdminFormSection title="Pricing">
            <AdminFieldGrid>
              <AdminField label="Price (INR)" hint="Whole rupees, or leave empty.">
                <Input
                  value={form.priceStr}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceStr: e.target.value }))
                  }
                  className={adminInputClass}
                  placeholder="569999"
                  inputMode="numeric"
                />
              </AdminField>
              <AdminField label="Currency">
                <Input
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  className={adminInputClass}
                />
              </AdminField>
            </AdminFieldGrid>
          </AdminFormSection>

          <AdminFormSection title="Description">
            <AdminField label="Product copy">
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={4}
                className={adminTextareaClass}
              />
            </AdminField>
          </AdminFormSection>

          <AdminFormSection
            title="Specifications"
            description="Label/value pairs on the product page."
            defaultOpen={false}
          >
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-zinc-400">
                    Specifications (label / value)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-600 bg-zinc-950 text-xs text-zinc-200"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        specs: [...f.specs, { label: "", value: "" }],
                      }))
                    }
                  >
                    Add row
                  </Button>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Rows with empty label or value are ignored on save. Shown on
                  the product detail panel as structured specs.
                </p>
                {form.specs.length === 0 ? (
                  <p className="text-xs text-zinc-600">
                    No specification rows. Use Add row to enter bullet-style
                    highlights.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.specs.map((row, i) => (
                      <div
                        key={`spec-draft-${i}`}
                        className="flex flex-col gap-2 sm:flex-row sm:items-start"
                      >
                        <Input
                          aria-label={`Spec label ${i + 1}`}
                          placeholder="Label"
                          value={row.label}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((f) => {
                              const next = [...f.specs];
                              next[i] = { ...next[i], label: v };
                              return { ...f, specs: next };
                            });
                          }}
                          className={adminInputClass}
                        />
                        <Input
                          aria-label={`Spec value ${i + 1}`}
                          placeholder="Value"
                          value={row.value}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((f) => {
                              const next = [...f.specs];
                              next[i] = { ...next[i], value: v };
                              return { ...f, specs: next };
                            });
                          }}
                          className={adminInputClass}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-zinc-600 bg-zinc-950 text-xs text-zinc-400 hover:text-rose-300"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              specs: f.specs.filter((_, j) => j !== i),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
          </AdminFormSection>

          <AdminFormSection
            title="Variants"
            description="Checkout options and price deltas."
            defaultOpen={false}
          >
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-zinc-400">
                    Variants (SKU id / label / price +INR)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-600 bg-zinc-950 text-xs text-zinc-200"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        variantRows: [
                          ...f.variantRows,
                          { id: "", label: "", priceModifierStr: "" },
                        ],
                      }))
                    }
                  >
                    Add variant
                  </Button>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Stable <span className="text-zinc-400">id</span> is sent at
                  checkout. Leave empty for no custom variants — storefront uses
                  a default configuration. Modifier adds to base price (blank =
                  none).
                </p>
                {form.variantRows.length === 0 ? (
                  <p className="text-xs text-zinc-600">
                    No variant rows — PDP shows “Standard configuration”.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.variantRows.map((row, i) => (
                      <div
                        key={`variant-draft-${i}`}
                        className="flex flex-col gap-2 lg:flex-row lg:items-start"
                      >
                        <Input
                          aria-label={`Variant id ${i + 1}`}
                          placeholder="id (e.g. front-pair)"
                          value={row.id}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((f) => {
                              const next = [...f.variantRows];
                              next[i] = { ...next[i], id: v };
                              return { ...f, variantRows: next };
                            });
                          }}
                          className={adminInputClass}
                        />
                        <Input
                          aria-label={`Variant label ${i + 1}`}
                          placeholder="Label shown to customer"
                          value={row.label}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((f) => {
                              const next = [...f.variantRows];
                              next[i] = { ...next[i], label: v };
                              return { ...f, variantRows: next };
                            });
                          }}
                          className={adminInputClass}
                        />
                        <Input
                          aria-label={`Variant price modifier ${i + 1}`}
                          placeholder="+INR (optional)"
                          value={row.priceModifierStr}
                          inputMode="numeric"
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((f) => {
                              const next = [...f.variantRows];
                              next[i] = { ...next[i], priceModifierStr: v };
                              return { ...f, variantRows: next };
                            });
                          }}
                          className={adminInputClass}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-zinc-600 bg-zinc-950 text-xs text-zinc-400 hover:text-rose-300"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              variantRows: f.variantRows.filter(
                                (_, j) => j !== i
                              ),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
          </AdminFormSection>

          <AdminFormSection
            title="Media & fitment"
            description="Images and compatible vehicle slugs."
            defaultOpen={false}
          >
            <AdminField label="Image URLs" hint="Comma-separated.">
              <Input
                value={form.imagesStr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imagesStr: e.target.value }))
                }
                className={adminInputClass}
                placeholder="https://..., https://..."
              />
            </AdminField>
            <AdminField label="Vehicle slugs" hint="Comma-separated platform slugs.">
              <Input
                value={form.vehicleSlugsStr}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    vehicleSlugsStr: e.target.value,
                  }))
                }
                className={adminInputClass}
                placeholder="toyota-hilux, mahindra-thar"
              />
            </AdminField>
            {!editingInternalId ? (
              <AdminField label="Legacy ID" hint="Migration only.">
                <Input
                  value={form.legacyId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, legacyId: e.target.value }))
                  }
                  className={adminInputClass}
                />
              </AdminField>
            ) : null}
          </AdminFormSection>
        </AdminFormStack>
      </AdminEditSheet>
    </div>
  );
}
