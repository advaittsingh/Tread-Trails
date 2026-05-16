import { listBrandEntries } from "@/lib/server/brand-catalog";
import { listBuilds } from "@/lib/server/build-catalog";
import { listProductCategories } from "@/lib/server/product-catalog";
import { listVehicles } from "@/lib/server/vehicle-catalog";

export type NavCatalogueLink = {
  label: string;
  href: string;
};

export type NavCatalogueSection = {
  key: "brands" | "builds" | "products" | "vehicles";
  label: string;
  hubHref: string;
  items: NavCatalogueLink[];
};

export type NavCatalogueData = {
  sections: NavCatalogueSection[];
};

async function listCategories(): Promise<string[]> {
  return listProductCategories();
}

/** Mega-menu catalogue columns (server-only; used in root layout). */
export async function getNavCatalogueData(): Promise<NavCatalogueData> {
  const [brands, builds, vehicles, categories] = await Promise.all([
    listBrandEntries(),
    listBuilds(),
    listVehicles(),
    listCategories(),
  ]);

  const sections: NavCatalogueSection[] = [
    {
      key: "brands",
      label: "Brands",
      hubHref: "/brands",
      items: brands.map((b) => ({
        label: b.name,
        href: `/brands/${b.slug}`,
      })),
    },
    {
      key: "builds",
      label: "Builds",
      hubHref: "/builds",
      items: builds.map((b) => ({
        label: b.title,
        href: `/build/${b.slug}`,
      })),
    },
    {
      key: "products",
      label: "Products",
      hubHref: "/products",
      items: categories.map((category) => ({
        label: category,
        href: `/products?category=${encodeURIComponent(category)}`,
      })),
    },
    {
      key: "vehicles",
      label: "Vehicles",
      hubHref: "/vehicles",
      items: vehicles.map((v) => ({
        label: v.name,
        href: `/vehicle/${v.slug}`,
      })),
    },
  ];

  return { sections };
}
