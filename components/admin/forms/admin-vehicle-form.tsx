"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Car } from "@/data/types";
import { useConfirmation } from "@/contexts/confirmation-context";
import {
  VEHICLE_CATEGORY_ORDER,
  type VehicleCategory,
} from "@/lib/vehicle-categories";
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
import { AdminImageField } from "@/components/admin/admin-image-field";
import { AdminRecordPage } from "@/components/admin/admin-record-page";
import { Input } from "@/components/ui/input";

type VehicleFormState = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  thumbnail: string;
  category: VehicleCategory;
  engineSummary: string;
  modelYearsLabel: string;
  trimSummary: string;
  legacyId: string;
  modelId: string;
  generationKey: string;
};

function emptyForm(): VehicleFormState {
  return {
    slug: "",
    name: "",
    tagline: "",
    description: "",
    heroImage: "",
    thumbnail: "",
    category: VEHICLE_CATEGORY_ORDER[0],
    engineSummary: "",
    modelYearsLabel: "",
    trimSummary: "",
    legacyId: "",
    modelId: "",
    generationKey: "",
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

export function AdminVehicleForm({ recordId }: { recordId: string | null }) {
  const router = useRouter();
  const { confirmDelete } = useConfirmation();
  const isNew = recordId === null;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [models, setModels] = useState<
    Array<{ id: string; name: string; make: { name: string } }>
  >([]);

  useEffect(() => {
    async function loadModels() {
      const res = await fetch("/api/admin/vehicle-models", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setModels(data.models);
    }
    void loadModels();
  }, []);

  const load = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/vehicles/${recordId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load vehicle");
      const v = data.vehicle as Car;
      const rowId = typeof data.id === "string" ? data.id : recordId;
      setForm({
        slug: v.slug,
        name: v.name,
        tagline: v.tagline ?? "",
        description: v.description ?? "",
        heroImage: v.heroImage,
        thumbnail: v.thumbnail,
        category: v.category as VehicleCategory,
        engineSummary: v.engineSummary ?? "",
        modelYearsLabel: v.modelYearsLabel ?? "",
        trimSummary: v.trimSummary ?? "",
        legacyId: v.id !== rowId ? v.id : "",
        modelId: typeof data.modelId === "string" ? data.modelId : "",
        generationKey: v.generationKey ?? "",
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

    if (!form.slug.trim() || !form.name.trim()) {
      setFormError("Slug and name are required.");
      setSaving(false);
      return;
    }
    if (!form.heroImage.trim() || !form.thumbnail.trim()) {
      setFormError("Hero image and thumbnail are required.");
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      tagline: form.tagline,
      description: form.description,
      heroImage: form.heroImage.trim(),
      thumbnail: form.thumbnail.trim(),
      category: form.category,
      engineSummary: form.engineSummary,
      modelYearsLabel: form.modelYearsLabel,
      trimSummary: form.trimSummary,
      modelId: form.modelId.trim() || null,
      generationKey: form.generationKey.trim() || null,
    };

    try {
      if (recordId) {
        if (form.legacyId.trim()) payload.legacyId = form.legacyId.trim();
        else payload.legacyId = null;

        const res = await fetch(`/api/admin/vehicles/${recordId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(apiErrorMessage(data, "Update failed"));
      } else {
        if (form.legacyId.trim()) payload.legacyId = form.legacyId.trim();

        const res = await fetch(`/api/admin/vehicles`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(apiErrorMessage(data, "Create failed"));
        const newId = (data.id ?? data.vehicle?.id) as string | undefined;
        if (newId) router.replace(`/admin/vehicles/${newId}`);
      }
      toastSuccess(
        isNew ? "Vehicle created" : "Vehicle updated",
        form.slug.trim()
      );
      if (recordId) router.push("/admin/vehicles");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setFormError(msg);
      toastError("Could not save vehicle", msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!recordId) return;
    const confirmed = await confirmDelete({
      title: "Delete this vehicle?",
      description:
        "Product compatibility and builds referencing this platform may break.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${recordId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toastSuccess("Vehicle deleted", form.slug.trim());
      router.push("/admin/vehicles");
    } catch (e) {
      toastError("Delete failed", e instanceof Error ? e.message : "Error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminRecordPage
      listHref="/admin/vehicles"
      listLabel="All vehicles"
      title={isNew ? "New vehicle" : "Edit vehicle"}
      subtitle="Platform hub at /vehicles/[slug]."
      formError={formError}
      loading={loading}
      saving={saving}
      onSave={() => void onSave()}
      onDelete={recordId ? () => void onDelete() : undefined}
      deleting={deleting}
      media={
        <>
          <AdminImageField
            label="Hero image"
            value={form.heroImage}
            onChange={(heroImage) => setForm((f) => ({ ...f, heroImage }))}
            folder="vehicles"
          />
          <AdminImageField
            label="Thumbnail"
            value={form.thumbnail}
            onChange={(thumbnail) => setForm((f) => ({ ...f, thumbnail }))}
            folder="vehicles"
            aspectClass="aspect-square"
          />
        </>
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
                placeholder="toyota-hilux"
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
          <AdminField label="Category">
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value as VehicleCategory,
                }))
              }
              className={adminSelectClass}
            >
              {VEHICLE_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminFieldGrid>
            <AdminField label="Model line" hint="OEM hierarchy">
              <select
                value={form.modelId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, modelId: e.target.value }))
                }
                className={adminSelectClass}
              >
                <option value="">Unassigned</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.make.name} · {m.name}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Generation key" hint="e.g. gen1">
              <Input
                value={form.generationKey}
                onChange={(e) =>
                  setForm((f) => ({ ...f, generationKey: e.target.value }))
                }
                className={adminInputClass}
                placeholder="gen1"
              />
            </AdminField>
          </AdminFieldGrid>
        </AdminFormSection>

        <AdminFormSection title="Story">
          <AdminField label="Description">
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

        <AdminFormSection title="Technical" defaultOpen={false}>
          <AdminField label="Engine summary">
            <textarea
              value={form.engineSummary}
              onChange={(e) =>
                setForm((f) => ({ ...f, engineSummary: e.target.value }))
              }
              rows={3}
              className={adminTextareaClass}
            />
          </AdminField>
          <AdminFieldGrid>
            <AdminField label="Model years">
              <Input
                value={form.modelYearsLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, modelYearsLabel: e.target.value }))
                }
                className={adminInputClass}
                placeholder="2016–2024"
              />
            </AdminField>
            <AdminField label="Legacy ID">
              <Input
                value={form.legacyId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, legacyId: e.target.value }))
                }
                className={adminInputClass}
              />
            </AdminField>
          </AdminFieldGrid>
          <AdminField label="Trim summary">
            <textarea
              value={form.trimSummary}
              onChange={(e) =>
                setForm((f) => ({ ...f, trimSummary: e.target.value }))
              }
              rows={3}
              className={adminTextareaClass}
            />
          </AdminField>
        </AdminFormSection>
      </AdminFormStack>
    </AdminRecordPage>
  );
}
