"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirmation } from "@/contexts/confirmation-context";
import { toastError, toastSuccess } from "@/lib/toast";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import {
  AdminField,
  AdminFieldGrid,
  AdminFormSection,
  AdminFormStack,
  adminInputClass,
} from "@/components/admin/admin-form-ui";
import { AdminImageField } from "@/components/admin/admin-image-field";
import { AdminRecordPage } from "@/components/admin/admin-record-page";
import { Input } from "@/components/ui/input";

function emptyForm() {
  return {
    slug: "",
    name: "",
    tagline: "",
    logoSrc: "",
    sortOrderStr: "0",
  };
}

function apiErrorMessage(data: Record<string, unknown>, fallback: string): string {
  if (typeof data.error === "string") return data.error;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.details === "object" && data.details !== null) {
    return JSON.stringify(data.details);
  }
  return fallback;
}

export function AdminBrandForm({ recordId }: { recordId: string | null }) {
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
      const res = await fetch(`/api/admin/brands/${recordId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load brand");
      const b = data.brand as {
        slug: string;
        name: string;
        tagline: string;
        logoSrc: string;
        sortOrder: number;
      };
      setForm({
        slug: b.slug,
        name: b.name,
        tagline: b.tagline ?? "",
        logoSrc: b.logoSrc ?? "",
        sortOrderStr: String(b.sortOrder ?? 0),
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

  function parseSortOrder(): { ok: true; value: number } | { ok: false; message: string } {
    const raw = form.sortOrderStr.trim();
    const n = raw === "" ? 0 : Number.parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0 || n > 9999) {
      return { ok: false, message: "Sort order must be an integer from 0 to 9999." };
    }
    return { ok: true, value: n };
  }

  async function onSave() {
    setSaving(true);
    setFormError(null);

    if (!form.slug.trim() || !form.name.trim()) {
      setFormError("Slug and name are required.");
      setSaving(false);
      return;
    }

    const sort = parseSortOrder();
    if (!sort.ok) {
      setFormError(sort.message);
      setSaving(false);
      return;
    }

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      tagline: form.tagline,
      logoSrc: form.logoSrc,
      sortOrder: sort.value,
    };

    try {
      if (recordId) {
        const res = await fetch(`/api/admin/brands/${recordId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(apiErrorMessage(data, "Update failed"));
      } else {
        const res = await fetch(`/api/admin/brands`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(apiErrorMessage(data, "Create failed"));
        const newId = (data.brand as { id?: string } | undefined)?.id;
        if (newId) {
          router.replace(`/admin/brands/${newId}`);
        }
      }
      toastSuccess(isNew ? "Brand created" : "Brand updated", form.slug.trim());
      if (recordId) router.push("/admin/brands");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setFormError(msg);
      toastError("Could not save brand", msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!recordId) return;
    const confirmed = await confirmDelete({
      title: "Delete this brand?",
      description: "Products may still reference this brand name as text.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/brands/${recordId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toastSuccess("Brand deleted", form.slug.trim());
      router.push("/admin/brands");
    } catch (e) {
      toastError(
        "Delete failed",
        e instanceof Error ? e.message : "Error"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminRecordPage
      listHref="/admin/brands"
      listLabel="All brands"
      title={isNew ? "New brand" : "Edit brand"}
      subtitle="Logo and catalog grouping for the storefront."
      formError={formError}
      loading={loading}
      saving={saving}
      onSave={() => void onSave()}
      onDelete={recordId ? () => void onDelete() : undefined}
      deleting={deleting}
      media={
        <AdminImageField
          label="Logo"
          value={form.logoSrc}
          onChange={(logoSrc) => setForm((f) => ({ ...f, logoSrc }))}
          folder="brands"
          aspectClass="aspect-square max-w-[280px]"
        />
      }
    >
      <AdminFormStack>
        <AdminFormSection title="Identity">
          <AdminFieldGrid>
            <AdminField label="URL slug" hint="Lowercase, hyphenated.">
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                className={adminInputClass}
                placeholder="arb"
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
          <AdminField label="Tagline">
            <Input
              value={form.tagline}
              onChange={(e) =>
                setForm((f) => ({ ...f, tagline: e.target.value }))
              }
              className={adminInputClass}
            />
          </AdminField>
          <AdminField label="Sort order" hint="Lower numbers appear first.">
            <Input
              value={form.sortOrderStr}
              onChange={(e) =>
                setForm((f) => ({ ...f, sortOrderStr: e.target.value }))
              }
              className={adminInputClass}
            />
          </AdminField>
        </AdminFormSection>
      </AdminFormStack>
    </AdminRecordPage>
  );
}
