/** Official Atom feed for the Tread Trails YouTube channel (no API key). */
const CHANNEL_ID = "UCcsx2ErWd728_f-ycIhzzKg";

const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export const TREAD_TRAILS_YOUTUBE_CHANNEL_URL =
  "https://www.youtube.com/@TreadTrails";

export type YoutubeFeedEntry = {
  videoId: string;
  title: string;
  publishedIso: string;
  thumbnailUrl: string;
};

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseAtomEntries(xml: string): YoutubeFeedEntry[] {
  const chunks = xml.split("<entry>");
  if (chunks.length < 2) return [];

  const out: YoutubeFeedEntry[] = [];
  for (let i = 1; i < chunks.length; i++) {
    const block = chunks[i] ?? "";
    const preMedia = block.split("<media:group>")[0] ?? block;
    const videoId = preMedia.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    if (!videoId) continue;

    const titleRaw =
      preMedia.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? "Video";
    const publishedIso =
      preMedia.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
    const thumb =
      block.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    out.push({
      videoId,
      title: decodeXmlEntities(titleRaw),
      publishedIso,
      thumbnailUrl: thumb,
    });
  }
  return out;
}

export async function fetchTreadTrailsYoutubeFeed(
  max = 15
): Promise<YoutubeFeedEntry[]> {
  try {
    const res = await fetch(RSS_URL, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TreadTrailsWebsite/1.0; +https://www.youtube.com/@TreadTrails)",
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseAtomEntries(xml).slice(0, max);
  } catch {
    return [];
  }
}
