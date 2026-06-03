import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_API_URL ??
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL;

export function hasBackendApi(): boolean {
  return Boolean(BACKEND?.trim());
}

/** @deprecated Use `useBackendApi` */
export const useBackendAuth = hasBackendApi;

/** Path + query from the incoming Next request (e.g. `/api/products?slug=x`). */
export function requestApiPath(req: Request): string {
  const url = new URL(req.url);
  return url.pathname + url.search;
}

/**
 * Forward a storefront API request to the Express API (strangler migration).
 * Forwards cookies and Set-Cookie so the browser keeps a single session on the Next origin.
 */
export async function proxyApiRoute(
  req: Request,
  apiPath: string
): Promise<NextResponse> {
  const base = BACKEND!.replace(/\/$/, "");
  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  const url = `${base}${path}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.text() : undefined;

  const backendRes = await fetch(url, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  const resHeaders = new Headers();
  const backendContentType = backendRes.headers.get("content-type");
  if (backendContentType) {
    resHeaders.set("content-type", backendContentType);
  }

  if (typeof backendRes.headers.getSetCookie === "function") {
    for (const c of backendRes.headers.getSetCookie()) {
      resHeaders.append("set-cookie", c);
    }
  } else {
    const raw = backendRes.headers.get("set-cookie");
    if (raw) resHeaders.append("set-cookie", raw);
  }

  const text = await backendRes.text();
  return new NextResponse(text, {
    status: backendRes.status,
    headers: resHeaders,
  });
}

/** @deprecated Use `proxyApiRoute` */
export const proxyAuthRoute = proxyApiRoute;
