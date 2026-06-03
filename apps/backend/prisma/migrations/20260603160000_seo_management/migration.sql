-- SEO management

CREATE TABLE "SeoSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "siteName" TEXT NOT NULL DEFAULT 'Tread Trails',
  "titleTemplate" TEXT NOT NULL DEFAULT '%s | Tread Trails',
  "defaultMetaDescription" TEXT NOT NULL DEFAULT '',
  "defaultOgImage" TEXT NOT NULL DEFAULT '/opengraph-image',
  "defaultRobots" TEXT NOT NULL DEFAULT 'index,follow',
  "canonicalBaseUrl" TEXT NOT NULL DEFAULT '',
  "organizationSchema" JSONB NOT NULL DEFAULT '{}',
  "productSchema" JSONB NOT NULL DEFAULT '{}',
  "brandSchema" JSONB NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeoSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeoRoute" (
  "id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT '',
  "metaTitle" TEXT NOT NULL DEFAULT '',
  "metaDescription" TEXT NOT NULL DEFAULT '',
  "canonicalUrl" TEXT NOT NULL DEFAULT '',
  "ogImageUrl" TEXT NOT NULL DEFAULT '',
  "robots" TEXT NOT NULL DEFAULT '',
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeoRoute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeoRoute_path_key" ON "SeoRoute"("path");

INSERT INTO "SeoSettings" ("id", "updatedAt")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
