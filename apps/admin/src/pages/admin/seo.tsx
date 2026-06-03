import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
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

type SeoSettings = {
  siteName: string;
  titleTemplate: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  defaultRobots: string;
  canonicalBaseUrl: string;
  organizationSchema: Record<string, unknown>;
  productSchema: Record<string, unknown>;
  brandSchema: Record<string, unknown>;
};

type SeoRoute = {
  id: string;
  path: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  robots: string;
};

const ROBOTS_PRESETS = [
  "index,follow",
  "index,nofollow",
  "noindex,follow",
  "noindex,nofollow",
];

export default function SeoPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const dashQ = useAdminQuery<{ settings: SeoSettings; routes: SeoRoute[] }>(
    "/api/admin/seo"
  );

  const [settings, setSettings] = useState<SeoSettings | null>(null);
  const [orgJson, setOrgJson] = useState("{}");
  const [productJson, setProductJson] = useState("{}");
  const [brandJson, setBrandJson] = useState("{}");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [routeForm, setRouteForm] = useState({
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImageUrl: "",
    robots: "",
  });
  const [newRoutePath, setNewRoutePath] = useState("");
  const [newRouteLabel, setNewRouteLabel] = useState("");

  useEffect(() => {
    const s = dashQ.data?.settings;
    if (!s) return;
    setSettings(s);
    setOrgJson(JSON.stringify(s.organizationSchema ?? {}, null, 2));
    setProductJson(JSON.stringify(s.productSchema ?? {}, null, 2));
    setBrandJson(JSON.stringify(s.brandSchema ?? {}, null, 2));
  }, [dashQ.data]);

  useEffect(() => {
    const route = dashQ.data?.routes.find((r) => r.id === selectedRouteId);
    if (!route) return;
    setRouteForm({
      metaTitle: route.metaTitle,
      metaDescription: route.metaDescription,
      canonicalUrl: route.canonicalUrl,
      ogImageUrl: route.ogImageUrl,
      robots: route.robots,
    });
  }, [selectedRouteId, dashQ.data]);

  const saveSettings = useMutation({
    mutationFn: () =>
      apiFetchJson("/api/admin/seo/settings", {
        method: "PATCH",
        body: JSON.stringify({
          ...settings,
          organizationSchema: JSON.parse(orgJson || "{}"),
          productSchema: JSON.parse(productJson || "{}"),
          brandSchema: JSON.parse(brandJson || "{}"),
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Global SEO saved" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const saveRoute = useMutation({
    mutationFn: () =>
      apiFetchJson(`/api/admin/seo/routes/${selectedRouteId}`, {
        method: "PATCH",
        body: JSON.stringify(routeForm),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Route SEO saved" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const createRoute = useMutation({
    mutationFn: () =>
      apiFetchJson("/api/admin/seo/routes", {
        method: "POST",
        body: JSON.stringify({ path: newRoutePath, label: newRouteLabel }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      setNewRoutePath("");
      setNewRouteLabel("");
      toast({ title: "Route added" });
    },
    onError: (e: Error) =>
      toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });

  const routes = dashQ.data?.routes ?? [];

  return (
    <Tabs defaultValue="global" className="w-full">
      <CardContent className="px-3 lg:px-6 pb-4">
        <TabsList>
          <TabsTrigger value="global">Global defaults</TabsTrigger>
          <TabsTrigger value="routes">Page routes</TabsTrigger>
          <TabsTrigger value="schema">Structured data</TabsTrigger>
        </TabsList>
      </CardContent>

      <TabsContent value="global">
        <CardContent className="px-3 lg:px-6 pb-6 space-y-4">
          {settings ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Site name</Label>
                  <Input value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
                </div>
                <div>
                  <Label>Title template</Label>
                  <Input value={settings.titleTemplate} onChange={(e) => setSettings({ ...settings, titleTemplate: e.target.value })} />
                </div>
                <div>
                  <Label>Default OG image</Label>
                  <Input value={settings.defaultOgImage} onChange={(e) => setSettings({ ...settings, defaultOgImage: e.target.value })} />
                </div>
                <div>
                  <Label>Canonical base URL (optional)</Label>
                  <Input value={settings.canonicalBaseUrl} onChange={(e) => setSettings({ ...settings, canonicalBaseUrl: e.target.value })} placeholder="https://treadtrails.com" />
                </div>
                <div>
                  <Label>Default robots</Label>
                  <Select value={settings.defaultRobots || ROBOTS_PRESETS[0]} onValueChange={(v) => setSettings({ ...settings, defaultRobots: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROBOTS_PRESETS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Default meta description</Label>
                <Textarea value={settings.defaultMetaDescription} onChange={(e) => setSettings({ ...settings, defaultMetaDescription: e.target.value })} rows={3} />
              </div>
              <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>Save global SEO</Button>
            </>
          ) : (
            <p className="text-sm text-stone-600">Loading…</p>
          )}
        </CardContent>
      </TabsContent>

      <TabsContent value="routes">
        <AdminDataTable
          rows={routes as unknown as Record<string, unknown>[]}
          columns={[
            { key: "label", label: "Label" },
            { key: "path", label: "Path" },
            { key: "metaTitle", label: "Meta title" },
            { key: "robots", label: "Robots" },
          ]}
          emptyText={dashQ.isLoading ? "Loading…" : "No routes."}
          onRowClick={(row) => setSelectedRouteId(String(row.id))}
        />

        <CardContent className="px-3 lg:px-6 pb-6 space-y-4">
          {selectedRouteId ? (
            <>
              <p className="text-sm text-stone-600">
                Editing: {routes.find((r) => r.id === selectedRouteId)?.path}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Meta title</Label>
                  <Input value={routeForm.metaTitle} onChange={(e) => setRouteForm({ ...routeForm, metaTitle: e.target.value })} />
                </div>
                <div>
                  <Label>Canonical URL</Label>
                  <Input value={routeForm.canonicalUrl} onChange={(e) => setRouteForm({ ...routeForm, canonicalUrl: e.target.value })} />
                </div>
                <div>
                  <Label>OG image URL</Label>
                  <Input value={routeForm.ogImageUrl} onChange={(e) => setRouteForm({ ...routeForm, ogImageUrl: e.target.value })} />
                </div>
                <div>
                  <Label>Robots</Label>
                  <Select value={routeForm.robots || settings?.defaultRobots || ROBOTS_PRESETS[0]} onValueChange={(v) => setRouteForm({ ...routeForm, robots: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROBOTS_PRESETS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Meta description</Label>
                <Textarea value={routeForm.metaDescription} onChange={(e) => setRouteForm({ ...routeForm, metaDescription: e.target.value })} rows={3} />
              </div>
              <Button onClick={() => saveRoute.mutate()} disabled={saveRoute.isPending}>Save route</Button>
            </>
          ) : (
            <p className="text-sm text-stone-600">Select a route row to edit.</p>
          )}

          <div className="border-t pt-4 space-y-3">
            <Label>Add custom route</Label>
            <div className="flex flex-wrap gap-2">
              <Input className="max-w-xs" placeholder="/path" value={newRoutePath} onChange={(e) => setNewRoutePath(e.target.value)} />
              <Input className="max-w-xs" placeholder="Label" value={newRouteLabel} onChange={(e) => setNewRouteLabel(e.target.value)} />
              <Button variant="secondary" onClick={() => createRoute.mutate()} disabled={!newRoutePath || createRoute.isPending}>Add</Button>
            </div>
          </div>
        </CardContent>
      </TabsContent>

      <TabsContent value="schema">
        <CardContent className="px-3 lg:px-6 pb-6 space-y-6">
          <div>
            <Label>Organization schema (JSON-LD fields)</Label>
            <Textarea value={orgJson} onChange={(e) => setOrgJson(e.target.value)} rows={12} className="font-mono text-xs mt-1" />
          </div>
          <div>
            <Label>Product schema settings</Label>
            <p className="text-xs text-stone-500 mb-1">enabled, includeOffers, availabilityInStock, descriptionMaxLength</p>
            <Textarea value={productJson} onChange={(e) => setProductJson(e.target.value)} rows={8} className="font-mono text-xs" />
          </div>
          <div>
            <Label>Brand schema settings</Label>
            <p className="text-xs text-stone-500 mb-1">enabled, includeLogo</p>
            <Textarea value={brandJson} onChange={(e) => setBrandJson(e.target.value)} rows={6} className="font-mono text-xs" />
          </div>
          <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>Save structured data</Button>
        </CardContent>
      </TabsContent>
    </Tabs>
  );
}
