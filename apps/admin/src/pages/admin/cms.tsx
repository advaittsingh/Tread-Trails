import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Hero = {
  eyebrow?: string;
  title?: string;
  titleAccent?: string;
  description?: string;
  imageUrl?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

type PickerOptions = {
  products: Array<{ id: string; slug: string; name: string }>;
  builds: Array<{ id: string; slug: string; title: string }>;
  brands: Array<{ id: string; slug: string; name: string }>;
  vehicles: Array<{ id: string; slug: string; name: string }>;
};

const SECTIONS = ["platforms", "brands", "portfolio", "catalog", "concierge"] as const;
const PAGE_SLUGS = ["about", "contact", "corporate-inquiry"] as const;

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export default function CmsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const homepageQ = useAdminQuery<{ homepage: {
    hero: Hero;
    featuredProductSlugs: string[];
    featuredBuildSlugs: string[];
    sectionOrder: string[];
  } }>("/api/admin/cms/homepage");

  const optionsQ = useAdminQuery<PickerOptions>("/api/admin/cms/options");

  const [hero, setHero] = useState<Hero>({});
  const [productSlugs, setProductSlugs] = useState<string[]>([]);
  const [buildSlugs, setBuildSlugs] = useState<string[]>([]);
  const [sectionOrder, setSectionOrder] = useState<string[]>([...SECTIONS]);

  const [pageSlug, setPageSlug] = useState<string>("about");
  const [pageForm, setPageForm] = useState({
    title: "",
    eyebrow: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    sectionsJson: "[]",
  });

  const [brandId, setBrandId] = useState("");
  const [brandForm, setBrandForm] = useState({
    bannerSrc: "",
    seoTitle: "",
    seoDescription: "",
    contentBlocksJson: "[]",
  });

  const [vehicleId, setVehicleId] = useState("");
  const [vehicleForm, setVehicleForm] = useState({
    description: "",
    heroImage: "",
    thumbnail: "",
    seoTitle: "",
    seoDescription: "",
    galleryJson: "[]",
    contentBlocksJson: "[]",
  });

  const [buildId, setBuildId] = useState("");
  const [buildForm, setBuildForm] = useState({
    description: "",
    contentHtml: "",
    galleryJson: "[]",
    videoEmbedsJson: "[]",
    seoTitle: "",
    seoDescription: "",
    homeSpotlightRank: "",
  });

  useEffect(() => {
    const h = homepageQ.data?.homepage;
    if (!h) return;
    setHero(h.hero ?? {});
    setProductSlugs(h.featuredProductSlugs ?? []);
    setBuildSlugs(h.featuredBuildSlugs ?? []);
    setSectionOrder(h.sectionOrder?.length ? h.sectionOrder : [...SECTIONS]);
  }, [homepageQ.data]);

  const pageDetailQ = useAdminQuery<{ page: {
    title: string;
    eyebrow: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    sections: unknown[];
  } }>(`/api/admin/cms/pages/${pageSlug}`, undefined, { enabled: Boolean(pageSlug) });

  useEffect(() => {
    const p = pageDetailQ.data?.page;
    if (!p) return;
    setPageForm({
      title: p.title,
      eyebrow: p.eyebrow,
      description: p.description,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      sectionsJson: JSON.stringify(p.sections ?? [], null, 2),
    });
  }, [pageDetailQ.data, pageSlug]);

  const brandDetailQ = useAdminQuery<{ brand: {
    bannerSrc: string;
    seoTitle: string;
    seoDescription: string;
    contentBlocks: unknown[];
  } }>(
    brandId ? `/api/admin/cms/brands/${brandId}` : "",
    undefined,
    { enabled: Boolean(brandId) }
  );

  useEffect(() => {
    const b = brandDetailQ.data?.brand;
    if (!b) return;
    setBrandForm({
      bannerSrc: b.bannerSrc,
      seoTitle: b.seoTitle,
      seoDescription: b.seoDescription,
      contentBlocksJson: JSON.stringify(b.contentBlocks ?? [], null, 2),
    });
  }, [brandDetailQ.data, brandId]);

  const vehicleDetailQ = useAdminQuery<{ vehicle: {
    description: string;
    heroImage: string;
    thumbnail: string;
    seoTitle: string;
    seoDescription: string;
    galleryImages: string[];
    contentBlocks: unknown[];
  } }>(
    vehicleId ? `/api/admin/cms/vehicles/${vehicleId}` : "",
    undefined,
    { enabled: Boolean(vehicleId) }
  );

  useEffect(() => {
    const v = vehicleDetailQ.data?.vehicle;
    if (!v) return;
    setVehicleForm({
      description: v.description,
      heroImage: v.heroImage,
      thumbnail: v.thumbnail,
      seoTitle: v.seoTitle,
      seoDescription: v.seoDescription,
      galleryJson: JSON.stringify(v.galleryImages ?? [], null, 2),
      contentBlocksJson: JSON.stringify(v.contentBlocks ?? [], null, 2),
    });
  }, [vehicleDetailQ.data, vehicleId]);

  const buildDetailQ = useAdminQuery<{ build: {
    description: string;
    contentHtml: string;
    gallery: string[];
    videoEmbeds: string[];
    seoTitle: string;
    seoDescription: string;
    homeSpotlightRank: number | null;
  } }>(
    buildId ? `/api/admin/cms/builds/${buildId}` : "",
    undefined,
    { enabled: Boolean(buildId) }
  );

  useEffect(() => {
    const b = buildDetailQ.data?.build;
    if (!b) return;
    setBuildForm({
      description: b.description,
      contentHtml: b.contentHtml,
      galleryJson: JSON.stringify(b.gallery ?? [], null, 2),
      videoEmbedsJson: JSON.stringify(b.videoEmbeds ?? [], null, 2),
      seoTitle: b.seoTitle,
      seoDescription: b.seoDescription,
      homeSpotlightRank: b.homeSpotlightRank != null ? String(b.homeSpotlightRank) : "",
    });
  }, [buildDetailQ.data, buildId]);

  const saveHomepage = useMutation({
    mutationFn: () =>
      apiFetchJson("/api/admin/cms/homepage", {
        method: "PATCH",
        body: JSON.stringify({
          hero,
          featuredProductSlugs: productSlugs,
          featuredBuildSlugs: buildSlugs,
          sectionOrder,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Homepage saved" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const savePage = useMutation({
    mutationFn: () =>
      apiFetchJson(`/api/admin/cms/pages/${pageSlug}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: pageForm.title,
          eyebrow: pageForm.eyebrow,
          description: pageForm.description,
          seoTitle: pageForm.seoTitle,
          seoDescription: pageForm.seoDescription,
          sections: JSON.parse(pageForm.sectionsJson || "[]"),
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Page saved" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const saveBrand = useMutation({
    mutationFn: () =>
      apiFetchJson(`/api/admin/cms/brands/${brandId}`, {
        method: "PATCH",
        body: JSON.stringify({
          bannerSrc: brandForm.bannerSrc,
          seoTitle: brandForm.seoTitle,
          seoDescription: brandForm.seoDescription,
          contentBlocks: JSON.parse(brandForm.contentBlocksJson || "[]"),
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Brand CMS saved" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const saveVehicle = useMutation({
    mutationFn: () =>
      apiFetchJson(`/api/admin/cms/vehicles/${vehicleId}`, {
        method: "PATCH",
        body: JSON.stringify({
          description: vehicleForm.description,
          heroImage: vehicleForm.heroImage,
          thumbnail: vehicleForm.thumbnail,
          seoTitle: vehicleForm.seoTitle,
          seoDescription: vehicleForm.seoDescription,
          galleryImages: JSON.parse(vehicleForm.galleryJson || "[]"),
          contentBlocks: JSON.parse(vehicleForm.contentBlocksJson || "[]"),
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Vehicle CMS saved" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const saveBuild = useMutation({
    mutationFn: () =>
      apiFetchJson(`/api/admin/cms/builds/${buildId}`, {
        method: "PATCH",
        body: JSON.stringify({
          description: buildForm.description,
          contentHtml: buildForm.contentHtml,
          gallery: JSON.parse(buildForm.galleryJson || "[]"),
          videoEmbeds: JSON.parse(buildForm.videoEmbedsJson || "[]"),
          seoTitle: buildForm.seoTitle,
          seoDescription: buildForm.seoDescription,
          homeSpotlightRank: buildForm.homeSpotlightRank
            ? Number(buildForm.homeSpotlightRank)
            : null,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Build CMS saved" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = [...sectionOrder];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setSectionOrder(next);
  };

  const toggleSlug = (list: string[], slug: string) =>
    list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];

  return (
    <Tabs defaultValue="homepage" className="w-full">
      <CardContent className="px-3 lg:px-6 pb-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="builds">Builds</TabsTrigger>
        </TabsList>
      </CardContent>

      <TabsContent value="homepage">
        <CardContent className="px-3 lg:px-6 pb-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow" value={hero.eyebrow ?? ""} onChange={(v) => setHero({ ...hero, eyebrow: v })} />
            <Field label="Hero image URL" value={hero.imageUrl ?? ""} onChange={(v) => setHero({ ...hero, imageUrl: v })} />
            <Field label="Title" value={hero.title ?? ""} onChange={(v) => setHero({ ...hero, title: v })} />
            <Field label="Title accent" value={hero.titleAccent ?? ""} onChange={(v) => setHero({ ...hero, titleAccent: v })} />
            <Field label="Primary CTA label" value={hero.primaryCtaLabel ?? ""} onChange={(v) => setHero({ ...hero, primaryCtaLabel: v })} />
            <Field label="Primary CTA href" value={hero.primaryCtaHref ?? ""} onChange={(v) => setHero({ ...hero, primaryCtaHref: v })} />
            <Field label="Secondary CTA label" value={hero.secondaryCtaLabel ?? ""} onChange={(v) => setHero({ ...hero, secondaryCtaLabel: v })} />
            <Field label="Secondary CTA href" value={hero.secondaryCtaHref ?? ""} onChange={(v) => setHero({ ...hero, secondaryCtaHref: v })} />
          </div>
          <Field label="Description" value={hero.description ?? ""} onChange={(v) => setHero({ ...hero, description: v })} multiline />

          <div>
            <Label className="mb-2 block">Featured products</Label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {(optionsQ.data?.products ?? []).map((p) => (
                <Button
                  key={p.slug}
                  size="sm"
                  variant={productSlugs.includes(p.slug) ? "default" : "outline"}
                  onClick={() => setProductSlugs(toggleSlug(productSlugs, p.slug))}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Featured builds</Label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {(optionsQ.data?.builds ?? []).map((b) => (
                <Button
                  key={b.slug}
                  size="sm"
                  variant={buildSlugs.includes(b.slug) ? "default" : "outline"}
                  onClick={() => setBuildSlugs(toggleSlug(buildSlugs, b.slug))}
                >
                  {b.title}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Section order</Label>
            <ul className="space-y-2">
              {sectionOrder.map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-sm">
                  <span className="w-32 capitalize">{s}</span>
                  <Button size="sm" variant="secondary" onClick={() => moveSection(i, -1)}>↑</Button>
                  <Button size="sm" variant="secondary" onClick={() => moveSection(i, 1)}>↓</Button>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={() => saveHomepage.mutate()} disabled={saveHomepage.isPending}>
            Save homepage
          </Button>
        </CardContent>
      </TabsContent>

      <TabsContent value="pages">
        <CardContent className="px-3 lg:px-6 pb-6 space-y-4">
          <Select value={pageSlug} onValueChange={setPageSlug}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SLUGS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Field label="Title" value={pageForm.title} onChange={(v) => setPageForm({ ...pageForm, title: v })} />
          <Field label="Eyebrow" value={pageForm.eyebrow} onChange={(v) => setPageForm({ ...pageForm, eyebrow: v })} />
          <Field label="Description" value={pageForm.description} onChange={(v) => setPageForm({ ...pageForm, description: v })} multiline />
          <Field label="SEO title" value={pageForm.seoTitle} onChange={(v) => setPageForm({ ...pageForm, seoTitle: v })} />
          <Field label="SEO description" value={pageForm.seoDescription} onChange={(v) => setPageForm({ ...pageForm, seoDescription: v })} multiline />
          <div>
            <Label>Sections (JSON blocks)</Label>
            <Textarea
              value={pageForm.sectionsJson}
              onChange={(e) => setPageForm({ ...pageForm, sectionsJson: e.target.value })}
              rows={10}
              className="font-mono text-xs"
            />
          </div>
          <Button onClick={() => savePage.mutate()} disabled={savePage.isPending}>Save page</Button>
        </CardContent>
      </TabsContent>

      <TabsContent value="brands">
        <CardContent className="px-3 lg:px-6 pb-6 space-y-4">
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select brand" /></SelectTrigger>
            <SelectContent>
              {(optionsQ.data?.brands ?? []).map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {brandId ? (
            <>
              <Field label="Banner image URL" value={brandForm.bannerSrc} onChange={(v) => setBrandForm({ ...brandForm, bannerSrc: v })} />
              <Field label="SEO title" value={brandForm.seoTitle} onChange={(v) => setBrandForm({ ...brandForm, seoTitle: v })} />
              <Field label="SEO description" value={brandForm.seoDescription} onChange={(v) => setBrandForm({ ...brandForm, seoDescription: v })} multiline />
              <div>
                <Label>Content blocks (JSON)</Label>
                <Textarea value={brandForm.contentBlocksJson} onChange={(e) => setBrandForm({ ...brandForm, contentBlocksJson: e.target.value })} rows={8} className="font-mono text-xs" />
              </div>
              <Button onClick={() => saveBrand.mutate()} disabled={saveBrand.isPending}>Save brand CMS</Button>
            </>
          ) : null}
        </CardContent>
      </TabsContent>

      <TabsContent value="vehicles">
        <CardContent className="px-3 lg:px-6 pb-6 space-y-4">
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
            <SelectContent>
              {(optionsQ.data?.vehicles ?? []).map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {vehicleId ? (
            <>
              <Field label="Description" value={vehicleForm.description} onChange={(v) => setVehicleForm({ ...vehicleForm, description: v })} multiline />
              <Field label="Hero image" value={vehicleForm.heroImage} onChange={(v) => setVehicleForm({ ...vehicleForm, heroImage: v })} />
              <Field label="Thumbnail" value={vehicleForm.thumbnail} onChange={(v) => setVehicleForm({ ...vehicleForm, thumbnail: v })} />
              <Field label="SEO title" value={vehicleForm.seoTitle} onChange={(v) => setVehicleForm({ ...vehicleForm, seoTitle: v })} />
              <Field label="SEO description" value={vehicleForm.seoDescription} onChange={(v) => setVehicleForm({ ...vehicleForm, seoDescription: v })} multiline />
              <div>
                <Label>Gallery URLs (JSON array)</Label>
                <Textarea value={vehicleForm.galleryJson} onChange={(e) => setVehicleForm({ ...vehicleForm, galleryJson: e.target.value })} rows={4} className="font-mono text-xs" />
              </div>
              <div>
                <Label>Content blocks (JSON)</Label>
                <Textarea value={vehicleForm.contentBlocksJson} onChange={(e) => setVehicleForm({ ...vehicleForm, contentBlocksJson: e.target.value })} rows={6} className="font-mono text-xs" />
              </div>
              <Button onClick={() => saveVehicle.mutate()} disabled={saveVehicle.isPending}>Save vehicle CMS</Button>
            </>
          ) : null}
        </CardContent>
      </TabsContent>

      <TabsContent value="builds">
        <CardContent className="px-3 lg:px-6 pb-6 space-y-4">
          <Select value={buildId} onValueChange={setBuildId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select build" /></SelectTrigger>
            <SelectContent>
              {(optionsQ.data?.builds ?? []).map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {buildId ? (
            <>
              <Field label="Summary / description" value={buildForm.description} onChange={(v) => setBuildForm({ ...buildForm, description: v })} multiline />
              <div>
                <Label>Rich content (HTML)</Label>
                <Textarea value={buildForm.contentHtml} onChange={(e) => setBuildForm({ ...buildForm, contentHtml: e.target.value })} rows={8} />
              </div>
              <div>
                <Label>Gallery URLs (JSON array)</Label>
                <Textarea value={buildForm.galleryJson} onChange={(e) => setBuildForm({ ...buildForm, galleryJson: e.target.value })} rows={4} className="font-mono text-xs" />
              </div>
              <div>
                <Label>Video embeds (JSON array of URLs)</Label>
                <Textarea value={buildForm.videoEmbedsJson} onChange={(e) => setBuildForm({ ...buildForm, videoEmbedsJson: e.target.value })} rows={3} className="font-mono text-xs" />
              </div>
              <Field label="SEO title" value={buildForm.seoTitle} onChange={(v) => setBuildForm({ ...buildForm, seoTitle: v })} />
              <Field label="SEO description" value={buildForm.seoDescription} onChange={(v) => setBuildForm({ ...buildForm, seoDescription: v })} multiline />
              <Field label="Home spotlight rank" value={buildForm.homeSpotlightRank} onChange={(v) => setBuildForm({ ...buildForm, homeSpotlightRank: v })} />
              <Button onClick={() => saveBuild.mutate()} disabled={saveBuild.isPending}>Save build CMS</Button>
            </>
          ) : null}
        </CardContent>
      </TabsContent>
    </Tabs>
  );
}
