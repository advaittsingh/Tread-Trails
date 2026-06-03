import { useState } from "react";
import { useCreateProduct } from "@/api/products/hooks";
import type { WizardDraft } from "@/api/products/types";
import { VehicleTreeSelector } from "./vehicle-tree-selector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  "General",
  "Pricing",
  "Inventory",
  "Images",
  "Compatibility",
  "SEO",
  "Publish",
] as const;

const emptyDraft = (): WizardDraft => ({
  slug: "",
  name: "",
  brand: "",
  category: "",
  price: null,
  currency: "INR",
  images: [],
  description: "",
  specs: [],
  variants: [],
  vehicleSlugs: [],
  seo: {
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImageUrl: "",
    robots: "index,follow",
  },
  stockQuantity: 0,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductCreateWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const { toast } = useToast();
  const createMut = useCreateProduct();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(emptyDraft);

  const patch = (p: Partial<WizardDraft>) => setDraft((d) => ({ ...d, ...p }));

  const reset = () => {
    setStep(0);
    setDraft(emptyDraft());
  };

  const publish = () => {
    if (!draft.slug || !draft.name) {
      toast({ title: "Slug and name required", variant: "destructive" });
      return;
    }
    if (draft.vehicleSlugs.length === 0) {
      toast({
        title: "Add vehicle compatibility",
        description: "At least one platform is required.",
        variant: "destructive",
      });
      return;
    }

    createMut.mutate(
      {
        slug: draft.slug,
        name: draft.name,
        brand: draft.brand || "Unbranded",
        category: draft.category || "General",
        price: draft.price,
        currency: draft.currency,
        images: draft.images.filter(Boolean),
        description: draft.description,
        specs: draft.specs,
        variants: draft.variants,
        vehicleSlugs: draft.vehicleSlugs,
      },
      {
        onSuccess: (res) => {
          const id = (res as { id?: string })?.id;
          toast({ title: "Product published" });
          onOpenChange(false);
          reset();
          if (id) onCreated?.(id);
        },
        onError: (e: Error) =>
          toast({ title: "Create failed", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New product — Step {step + 1}: {STEPS[step]}</DialogTitle>
          <div className="flex gap-1 pt-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${i <= step ? "bg-stone-900" : "bg-stone-200"}`}
              />
            ))}
          </div>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Product name</Label>
              <Input
                value={draft.name}
                onChange={(e) => {
                  const name = e.target.value;
                  patch({
                    name,
                    slug: draft.slug || slugify(name),
                    seo: { ...draft.seo, metaTitle: name },
                  });
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input
                value={draft.slug}
                onChange={(e) => patch({ slug: slugify(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Brand</Label>
                <Input value={draft.brand} onChange={(e) => patch({ brand: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Input value={draft.category} onChange={(e) => patch({ category: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={3}
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3 py-2">
            <Label className="text-xs">Selling price (INR)</Label>
            <Input
              type="number"
              value={draft.price ?? ""}
              onChange={(e) =>
                patch({
                  price: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
            <p className="text-xs text-stone-500">Leave empty for price-on-application.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 py-2">
            <Label className="text-xs">Initial stock quantity</Label>
            <Input
              type="number"
              value={draft.stockQuantity}
              onChange={(e) => patch({ stockQuantity: Number(e.target.value) || 0 })}
            />
            <p className="text-xs text-stone-500">
              Inventory SKU is auto-generated on first stock movement in Inventory module.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 py-2">
            <Label className="text-xs">Image URLs (one per line)</Label>
            <Textarea
              rows={4}
              value={draft.images.join("\n")}
              onChange={(e) =>
                patch({
                  images: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                })
              }
              placeholder="https://…"
            />
          </div>
        )}

        {step === 4 && (
          <VehicleTreeSelector
            selectedSlugs={draft.vehicleSlugs}
            onChange={(vehicleSlugs) => patch({ vehicleSlugs })}
          />
        )}

        {step === 5 && (
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Meta title</Label>
              <Input
                value={draft.seo.metaTitle}
                onChange={(e) =>
                  patch({ seo: { ...draft.seo, metaTitle: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Meta description</Label>
              <Textarea
                rows={3}
                value={draft.seo.metaDescription}
                onChange={(e) =>
                  patch({ seo: { ...draft.seo, metaDescription: e.target.value } })
                }
              />
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-2 py-2 text-sm">
            <p>
              <strong>{draft.name}</strong> · {draft.brand} · {draft.category}
            </p>
            <p className="text-stone-600">
              {draft.vehicleSlugs.length} vehicles ·{" "}
              {draft.price != null ? `₹${draft.price}` : "POA"}
            </p>
            {draft.vehicleSlugs.length === 0 && (
              <p className="text-amber-800 text-xs">Add compatibility before publishing.</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button onClick={publish} disabled={createMut.isPending}>
              Publish product
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
