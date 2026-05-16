"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { cars } from "@/data/cars";
import type { Build } from "@/data/types";
import { useConfirmation } from "@/contexts/confirmation-context";
import { parseTokens } from "@/lib/admin/parse-tokens";
import { toastError, toastSuccess } from "@/lib/toast";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import {
  AdminField,
  AdminFieldGrid,
  AdminFormSection,
  AdminFormStack,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/admin-form-ui";
import { AdminImageField, AdminImageListField } from "@/components/admin/admin-image-field";
import { AdminRecordPage } from "@/components/admin/admin-record-page";
import { Input } from "@/components/ui/input";

function emptyForm() {
  return {
    slug: "",
    title: "",
    vehicleSlug: "",
    summary: "",
    description: "",
    beforeImage: "",
    afterImage: "",
    gallery: [] as string[],
    productIdsStr: "",
    legacyId: "",
    homeSpotlightRankStr: "",
  };
}

export function AdminBuildForm({ recordId }: { recordId: string | null }) {
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
      const res = await fetch(`/api/admin/portfolio-builds/${recordId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load build");
      const b = data.build as Build;
      setForm({
        slug: b.slug,
        title: b.title,
        vehicleSlug: b.vehicleSlug,
        summary: b.summary ?? "",
        description: b.description ?? "",
        beforeImage: b.beforeImage,
        afterImage: b.afterImage,
        gallery: b.gallery ?? [],
        productIdsStr: (b.productIds ?? []).join(", "),
        legacyId: typeof data.legacyId === "string" ? data.legacyId : "",
        homeSpotlightRankStr:
          b.homeSpotlightRank != null ? String(b.homeSpotlightRank) : "",
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

  function parseSpotlightRank():
    | { ok: true; value: number | null | undefined }
    | { ok: false; message: string } {
    const rs = form.homeSpotlightRankStr.trim();
    if (rs === "") {
      return { ok: true, value: recordId ? null : undefined };
    }
    const n = Number.parseInt(rs, 10);
    if (Number.isNaN(n) || n < 0) {
      return {
        ok: false,
        message: "Home spotlight rank must be a non‑negative integer or blank.",
      };
    }
    return { ok: true, value: n };
  }

  async function onSave() {
    setSaving(true);
    setFormError(null);

    const productIds = parseTokens(form.productIdsStr);
    const spotlight = parseSpotlightRank();
    if (!spotlight.ok) {
      setFormError(spotlight.message);
      setSaving(false);
      return;
    }

    try {
      if (recordId) {
        const body: Record<string, unknown> = {
          slug: form.slug.trim(),
          title: form.title.trim(),
          vehicleSlug: form.vehicleSlug.trim(),
          summary: form.summary,
          description: form.description,
          beforeImage: form.beforeImage.trim(),
          afterImage: form.afterImage.trim(),
          gallery: form.gallery,
          productIds,
          homeSpotlightRank: spotlight.value ?? null,
        };
        if (form.legacyId.trim()) body.legacyId = form.legacyId.trim();
        else body.legacyId = null;

        const res = await fetch(`/api/admin/portfolio-builds/${recordId}`, {
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
        const body: Record<string, unknown> = {
          slug: form.slug.trim(),
          title: form.title.trim(),
          vehicleSlug: form.vehicleSlug.trim(),
          summary: form.summary,
          description: form.description,
          beforeImage: form.beforeImage.trim(),
          afterImage: form.afterImage.trim(),
          gallery: form.gallery,
          productIds,
        };
        if (form.legacyId.trim()) body.legacyId = form.legacyId.trim();
        if (spotlight.value !== undefined) {
          body.homeSpotlightRank = spotlight.value;
        }
        if (!body.slug || !body.title) {
          setFormError("Slug and title are required.");
          setSaving(false);
          return;
        }

        const res = await fetch(`/api/admin/portfolio-builds`, {
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
        if (newId) router.replace(`/admin/builds/${newId}`);
      }
      toastSuccess(isNew ? "Build created" : "Build updated", form.slug.trim());
      if (recordId) router.push("/admin/builds");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setFormError(msg);
      toastError("Could not save build", msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!recordId) return;
    const confirmed = await confirmDelete({
      title: "Delete this portfolio build?",
      description: "This cannot be undone.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/portfolio-builds/${recordId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toastSuccess("Build deleted", form.slug.trim());
      router.push("/admin/builds");
    } catch (e) {
      toastError("Delete failed", e instanceof Error ? e.message : "Error");
    } finally {
      setDeleting(false);
    }
  }

  const previewUrl = form.afterImage || form.beforeImage;

  return (
    <AdminRecordPage
      listHref="/admin/builds"
      listLabel="All builds"
      title={isNew ? "New build" : "Edit build"}
      subtitle="Case study on the storefront at /build/[slug]."
      formError={formError}
      loading={loading}
      saving={saving}
      onSave={() => void onSave()}
      onDelete={recordId ? () => void onDelete() : undefined}
      deleting={deleting}
      media={
        <>
          <AdminImageField
            label="Before"
            value={form.beforeImage}
            onChange={(beforeImage) => setForm((f) => ({ ...f, beforeImage }))}
            folder="builds"
          />
          <AdminImageField
            label="After"
            value={form.afterImage}
            onChange={(afterImage) => setForm((f) => ({ ...f, afterImage }))}
            folder="builds"
          />
          {previewUrl ? (
            <p className="text-[11px] text-zinc-600">
              Storefront preview uses the after image when set.
            </p>
          ) : null}
        </>
      }
    >
      <AdminFormStack>
        <AdminFormSection title="Basics">
          <AdminFieldGrid>
            <AdminField label="URL slug" hint="Lowercase, hyphenated.">
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                className={adminInputClass}
              />
            </AdminField>
            <AdminField label="Title">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className={adminInputClass}
              />
            </AdminField>
          </AdminFieldGrid>
          <AdminField label="Vehicle platform">
            <select
              value={form.vehicleSlug}
              onChange={(e) =>
                setForm((f) => ({ ...f, vehicleSlug: e.target.value }))
              }
              className={adminSelectClass}
            >
              <option value="">Select vehicle…</option>
              {cars.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </AdminField>
        </AdminFormSection>

        <AdminFormSection title="Story">
          <AdminField label="Summary">
            <textarea
              value={form.summary}
              onChange={(e) =>
                setForm((f) => ({ ...f, summary: e.target.value }))
              }
              rows={2}
              className={adminTextareaClass}
            />
          </AdminField>
          <AdminField label="Full description">
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

        <AdminFormSection
          title="Gallery"
          description="Extra photos beyond before/after."
          defaultOpen={false}
        >
          <AdminImageListField
            label="Gallery images"
            values={form.gallery}
            onChange={(gallery) => setForm((f) => ({ ...f, gallery }))}
            folder="builds"
          />
        </AdminFormSection>

        <AdminFormSection
          title="Catalog & homepage"
          defaultOpen={false}
        >
          <AdminField
            label="Linked products"
            hint="Product slugs or IDs, comma-separated."
          >
            <textarea
              value={form.productIdsStr}
              onChange={(e) =>
                setForm((f) => ({ ...f, productIdsStr: e.target.value }))
              }
              rows={2}
              className={adminTextareaClass}
            />
          </AdminField>
          <AdminFieldGrid>
            <AdminField label="Home spotlight rank" hint="Blank = not featured.">
              <Input
                value={form.homeSpotlightRankStr}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    homeSpotlightRankStr: e.target.value,
                  }))
                }
                className={adminInputClass}
              />
            </AdminField>
            <AdminField label="Legacy ID" hint="Migration only.">
              <Input
                value={form.legacyId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, legacyId: e.target.value }))
                }
                className={adminInputClass}
              />
            </AdminField>
          </AdminFieldGrid>
        </AdminFormSection>
      </AdminFormStack>
    </AdminRecordPage>
  );
}
