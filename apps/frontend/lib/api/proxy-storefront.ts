import type { NextResponse } from "next/server";

import {
  hasBackendApi,
  proxyApiRoute,
  requestApiPath,
} from "@/lib/api/backend-proxy";

/** Strangler: forward to Express when `BACKEND_API_URL` is set. */
export async function maybeProxyToBackend(
  req: Request
): Promise<NextResponse | null> {
  if (!hasBackendApi()) return null;
  return proxyApiRoute(req, requestApiPath(req));
}
