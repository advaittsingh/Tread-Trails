/**
 * Download model-specific vehicle photos from Wikimedia Commons (CC-licensed).
 * Run: node scripts/download-vehicle-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../public/vehicles");
const UA = "TreadTrails/1.0 (vehicle catalog; +https://treadtrails.com)";

/** Curated Commons file names — exact model / generation where available. */
const CURATED_FILES = {
  "toyota-hilux": "2016 Toyota Hilux SR5 (GUN126R) 4Door Ute (2018-11-15) 01.jpg",
  "toyota-fortuner-gen1": "Toyota Fortuner 3.0 D-4D (2006) (52720618381).jpg",
  "toyota-fortuner-gen2": "2016 Toyota Fortuner VRZ, West Surabaya.jpg",
  "toyota-fortuner-gen3": "Toyota Fortuner 4x4 Legender (LTD) 2022.jpg",
  "toyota-land-cruiser-prado-90": "TOYOTA LAND CRUISER PRADO (J90) China.jpg",
  "toyota-land-cruiser-prado-120":
    "Toyota Land Cruiser Prado (J120) 2006 Bahrain.jpg",
  "toyota-land-cruiser-prado-150": "Toyota Land Cruiser Prado 150.jpg",
  "toyota-land-cruiser-80-series": "Land Cruiser 80-series 7.jpg",
  "toyota-land-cruiser-100-series":
    "Toyota Land Cruiser in the Desert Side-Back View 20120409 1.jpg",
  "toyota-land-cruiser-200-series":
    "2016 Toyota Land Cruiser 200 Series VX (Uruguay) front.jpg",
  "toyota-land-cruiser-300-series": "Toyota Land Cruiser GR Sport.jpg",
  "isuzu-d-max-v-cross-2500cc": "2023 Isuzu D-Max V-Cross 4-Door 3.0 Ddi M.jpg",
  "isuzu-d-max-v-cross-1900cc": "2021 Isuzu D-Max V-Cross 4-Door.jpg",
  "mahindra-thar-gen1-crde": "Mahindra Thar 2.5 CRDe 2011.jpg",
  "mahindra-thar": "Mahindra Thar Flickr.jpg",
  "mahindra-thar-roxx": "Mahindra Thar ROXX on dirt.jpg",
  "mahindra-scorpio-classic": "Mahindra Scorpio Getaway 2014.jpg",
  "mahindra-scorpio-n": "Mahindra Scorpio-N Z8 2022.jpg",
  "force-gurkha": "Force Gurkha offroading.jpg",
  "maruti-suzuki-jimny": "Suzuki Jimny (2018) India.jpg",
  "maruti-gypsy": "Maruti Gypsy 1998.jpg",
  "mitsubishi-pajero-glx-sfx": "Mitsubishi Pajero V60 2005.jpg",
  "mitsubishi-pajero-sport": "MITSUBISHI PAJERO SPORT EXTERIOR China(1).jpg",
  "jeep-wrangler-jk": "Jeep Wrangler Unlimited 06.jpg",
  "jeep-wrangler-jl":
    "Jeep Wrangler Rubicon, GIMS 2018, Le Grand-Saconnex (1X7A1810).jpg",
  "ford-endeavour-3200cc": "Ford Everest Titanium 2017.jpg",
  "ford-endeavour-2000cc-10speed": "2021 Ford Everest Sport 2.0 Bi-Turbo.jpg",
  "armoured-special-utility":
    "Chevrolet Suburban LT GMTK2XX Diplomatic Black Armoured (4).jpg",
  "restoration-bmw": "1990 BMW 318 IS Convertible.jpg",
  "restoration-chevrolet":
    "(Photographed by David Adam Kess 1963 Chevy C10) truck bed.jpg",
  "restoration-mercedes-benz":
    "Moscow, MB meetup, Sept 2025 02 (Mercedes-Benz W124).jpg",
  "restoration-dodge": "2016 Dodge Challenger R T.jpg",
  "restoration-porsche": "Porsche 911 Targa pink dllu.jpg",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolveUrls(fileTitle, heroW, thumbW) {
  const title = fileTitle.startsWith("File:") ? fileTitle : `File:${fileTitle}`;
  const params = (w) =>
    new URLSearchParams({
      action: "query",
      format: "json",
      titles: title,
      prop: "imageinfo",
      iiprop: "url|mime|size|extmetadata",
      iiurlwidth: String(w),
    });
  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params(heroW)}`,
    { headers: { "User-Agent": UA } }
  );
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page?.imageinfo?.[0]) throw new Error(`Not found: ${title}`);
  const info = page.imageinfo[0];
  await sleep(400);
  const res2 = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params(thumbW)}`,
    { headers: { "User-Agent": UA } }
  );
  const data2 = await res2.json();
  const thumb = Object.values(data2.query?.pages ?? {})[0]?.imageinfo?.[0]
    ?.thumburl;
  return {
    title,
    heroUrl: info.thumburl || info.url,
    thumbUrl: thumb || info.thumburl || info.url,
    license:
      info.extmetadata?.LicenseShortName?.value ??
      info.extmetadata?.UsageTerms?.value ??
      "Wikimedia Commons",
  };
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function ext(url) {
  const e = path.extname(new URL(url).pathname).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].includes(e) ? e : ".jpg";
}

async function downloadSlug(slug, fileTitle) {
  const { title, heroUrl, thumbUrl, license } = await resolveUrls(
    fileTitle,
    1400,
    520
  );
  const dir = path.join(OUT_DIR, slug);
  const heroExt = ext(heroUrl);
  const thumbExt = ext(thumbUrl);
  await download(heroUrl, path.join(dir, `hero${heroExt}`));
  await download(thumbUrl, path.join(dir, `thumb${thumbExt}`));
  return {
    commonsTitle: title,
    hero: `hero${heroExt}`,
    thumb: `thumb${thumbExt}`,
    attribution: license,
  };
}

/** Fallback search when curated filename is missing. */
async function searchAndDownload(slug, query) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: "1400",
  });
  await sleep(500);
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": UA },
  });
  const data = await res.json();
  const pages = Object.values(data.query?.pages ?? {})
    .filter((p) => p.imageinfo?.[0])
    .filter((p) => (p.imageinfo[0].width ?? 0) >= 900)
    .filter((p) => !(p.imageinfo[0].mime ?? "").includes("svg"))
    .sort(
      (a, b) =>
        (b.imageinfo[0].width ?? 0) * (b.imageinfo[0].height ?? 0) -
        (a.imageinfo[0].width ?? 0) * (a.imageinfo[0].height ?? 0)
    );
  if (!pages.length) throw new Error(`Search empty: ${query}`);
  const name = pages[0].title.replace(/^File:/, "");
  return downloadSlug(slug, name);
}

const SEARCH_FALLBACK = {
  "toyota-land-cruiser-200-series": "Toyota Land Cruiser J200 2016 exterior",
  "isuzu-d-max-v-cross-1900cc": "Isuzu D-Max V-Cross 2020 exterior",
  "mahindra-scorpio-classic": "Mahindra Scorpio Classic SUV",
  "mahindra-scorpio-n": "Mahindra Scorpio-N SUV 2022",
  "maruti-suzuki-jimny": "Maruti Suzuki Jimny 2019",
  "maruti-gypsy": "Maruti Gypsy King",
  "mitsubishi-pajero-glx-sfx": "Mitsubishi Pajero Montero exterior",
  "ford-endeavour-3200cc": "Ford Everest Titanium India exterior",
  "ford-endeavour-2000cc-10speed": "Ford Everest 2021 Sport exterior",
};

async function main() {
  const manifest = {};
  const failed = [];

  for (const [slug, file] of Object.entries(CURATED_FILES)) {
    try {
      manifest[slug] = await downloadSlug(slug, file);
      console.log(`✓ ${slug}`);
    } catch (e) {
      try {
        const q = SEARCH_FALLBACK[slug] ?? slug.replace(/-/g, " ");
        console.log(`  ↻ ${slug} (search: ${q})`);
        await sleep(800);
        manifest[slug] = await searchAndDownload(slug, q);
        console.log(`✓ ${slug} (fallback)`);
      } catch (e2) {
        console.error(`✗ ${slug}: ${e2.message}`);
        failed.push({ slug, file, error: e2.message });
      }
    }
    await sleep(600);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`\n${Object.keys(manifest).length}/${Object.keys(CURATED_FILES).length} ready`);
  if (failed.length) {
    fs.writeFileSync(
      path.join(OUT_DIR, "download-failures.json"),
      JSON.stringify(failed, null, 2)
    );
  }
}

main();
