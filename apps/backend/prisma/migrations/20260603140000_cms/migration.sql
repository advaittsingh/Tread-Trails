-- CMS: homepage, static pages, brand/vehicle/build/product CMS fields

ALTER TABLE "Product" ADD COLUMN "homeFeaturedRank" INTEGER;
CREATE INDEX "Product_homeFeaturedRank_idx" ON "Product"("homeFeaturedRank");

ALTER TABLE "Vehicle" ADD COLUMN "seoTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Vehicle" ADD COLUMN "seoDescription" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Vehicle" ADD COLUMN "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Vehicle" ADD COLUMN "contentBlocks" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "PortfolioBuild" ADD COLUMN "videoEmbeds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PortfolioBuild" ADD COLUMN "seoTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PortfolioBuild" ADD COLUMN "seoDescription" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PortfolioBuild" ADD COLUMN "contentHtml" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Brand" ADD COLUMN "bannerSrc" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Brand" ADD COLUMN "seoTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Brand" ADD COLUMN "seoDescription" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Brand" ADD COLUMN "contentBlocks" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE "CmsHomepage" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "hero" JSONB NOT NULL DEFAULT '{}',
  "featuredProductSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "featuredBuildSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sectionOrder" TEXT[] DEFAULT ARRAY['platforms','brands','portfolio','catalog','concierge']::TEXT[],
  "sectionConfig" JSONB NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CmsHomepage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CmsPage" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "eyebrow" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "hero" JSONB NOT NULL DEFAULT '{}',
  "sections" JSONB NOT NULL DEFAULT '[]',
  "seoTitle" TEXT NOT NULL DEFAULT '',
  "seoDescription" TEXT NOT NULL DEFAULT '',
  "published" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");

INSERT INTO "CmsHomepage" ("id", "hero", "updatedAt")
VALUES (
  'default',
  '{"eyebrow":"Expedition atelier","title":"Terrain,","titleAccent":"refined.","description":"Vehicle-native kits, armor, and lighting programs engineered with OEM discipline — delivered with boutique studio care.","imageUrl":"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=2400&q=80","primaryCtaLabel":"Book appointment","primaryCtaHref":"/booking","secondaryCtaLabel":"Explore vehicles","secondaryCtaHref":"/vehicles"}'::jsonb,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
