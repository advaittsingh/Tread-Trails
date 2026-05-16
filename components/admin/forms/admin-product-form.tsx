"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Product, ProductSpecification } from "@/data/types";
import { useConfirmation } from "@/contexts/confirmation-context";
import { AdminVehicleCompatPicker } from "@/components/admin/admin-vehicle-compat-picker";
import {
  specsPayload,
  variantsPayload,
  type VariantFormRow,
} from "@/lib/admin/product-form-helpers";
import { toastError, toastSuccess } from "@/lib/toast";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import {
  AdminField,
  AdminFieldGrid,
  AdminFormSection,
  AdminFormStack,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/admin-form-ui";
import { AdminImageListField } from "@/components/admin/admin-image-field";
import { AdminRecordPage } from "@/components/admin/admin-record-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    vehicleSlugs: [] as string[],
    images: [] as string[],
    specs: [] as ProductSpecification[],
    variantRows: [] as VariantFormRow[],
  };
}

export function AdminProductForm({ recordId }: { recordId: string | null }) {
  const router = useRouter();
  const { confirmDelete } = useConfirmation();
  const isNew = recordId === null;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/products/${recordId}`, {
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
        vehicleSlugs: p.compatibleCars ?? [],
        images: p.images ?? [],
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
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave() {
    setSaving(true);
    setFormError(null);

    const vehicleSlugs = form.vehicleSlugs;
    const priceTrim = form.priceStr.trim();
    const price = priceTrim === "" ? null : Number.parseInt(priceTrim, 10);
    if (priceTrim !== "" && (Number.isNaN(price!) || price! < 0)) {
      setFormError("Price must be a non‑negative whole number (INR).");
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

    try {
      if (recordId) {
        const body: Record<string, unknown> = {
          slug: form.slug.trim(),
          name: form.name.trim(),
          brand: form.brand.trim(),
          category: form.category.trim(),
          currency: form.currency.trim() || "INR",
          description: form.description,
          images: form.images,
          specs,
          variants: vp.variants,
          vehicleSlugs,
          price,
        };
        if (form.legacyId.trim()) body.legacyId = form.legacyId.trim();

        const res = await fetch(`/api/admin/products/${recordId}`, {
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
          images: form.images,
          specs,
          variants: vp.variants,
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
        const newId = data.id as string | undefined;
        if (newId) router.replace(`/admin/products/${newId}`);
      }
      toastSuccess(
        isNew ? "Product created" : "Product updated",
        form.slug.trim()
      );
      if (recordId) router.push("/admin/products");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setFormError(msg);
      toastError("Could not save product", msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!recordId) return;
    const confirmed = await confirmDelete({
      title: "Delete this product?",
      description: "This removes the SKU from the catalog.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${recordId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toastSuccess("Product deleted", form.slug.trim());
      router.push("/admin/products");
    } catch (e) {
      toastError("Delete failed", e instanceof Error ? e.message : "Error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminRecordPage
      listHref="/admin/products"
      listLabel="All products"
      title={isNew ? "New product" : "Edit product"}
      subtitle="Catalog SKU on the product detail page."
      formError={formError}
      loading={loading}
      saving={saving}
      onSave={() => void onSave()}
      onDelete={recordId ? () => void onDelete() : undefined}
      deleting={deleting}
      media={
        <AdminImageListField
          label="Product images"
          values={form.images}
          onChange={(images) => setForm((f) => ({ ...f, images }))}
          folder="products"
          hint="First image is used as the primary thumbnail in listings."
        />
      }
    >
      <AdminFormStack>
        <AdminFormSection title="Basics">
          <AdminFieldGrid>
            <AdminField label="URL slug">
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                className={adminInputClass}
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
            <AdminField label="Price (INR)">
              <Input
                value={form.priceStr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priceStr: e.target.value }))
                }
                className={adminInputClass}
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
              rows={5}
              className={adminTextareaClass}
            />
          </AdminField>
        </AdminFormSection>

        <AdminFormSection title="Specifications" defaultOpen={false}>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-zinc-400">Label / value rows</Label>
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
          {form.specs.map((row, i) => (
            <div
              key={`spec-${i}`}
              className="flex flex-col gap-2 sm:flex-row sm:items-start"
            >
              <Input
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
                className="shrink-0 border-zinc-600 text-zinc-400 hover:text-rose-300"
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
        </AdminFormSection>

        <AdminFormSection title="Variants" defaultOpen={false}>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-zinc-400">Checkout options</Label>
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
          {form.variantRows.map((row, i) => (
            <div
              key={`variant-${i}`}
              className="flex flex-col gap-2 lg:flex-row lg:items-start"
            >
              <Input
                placeholder="Variant id"
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
                placeholder="Customer label"
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
                placeholder="+INR"
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
                className="shrink-0 border-zinc-600 text-zinc-400 hover:text-rose-300"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    variantRows: f.variantRows.filter((_, j) => j !== i),
                  }))
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </AdminFormSection>

        <AdminFormSection title="Fitment" defaultOpen={false}>
          <AdminField
            label="Compatible platforms"
            hint="Grouped by OEM brand and model. Writes ProductVehicleCompatibility on save."
          >
            <AdminVehicleCompatPicker
              value={form.vehicleSlugs}
              onChange={(vehicleSlugs) =>
                setForm((f) => ({ ...f, vehicleSlugs }))
              }
              disabled={saving}
            />
          </AdminField>
          {isNew ? (
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
    </AdminRecordPage>
  );
}
