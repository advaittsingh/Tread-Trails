import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";

import { AUTH_COOKIE } from "@/lib/constants";

/** Server-only guard for `/admin` routes — JWT must exist and `role` === admin */
export async function requireAdminSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect("/login?redirect=/admin");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    redirect("/login?redirect=/admin");
  }

  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    if (payload.role !== "admin") {
      redirect("/login?redirect=/admin");
    }
  } catch {
    redirect("/login?redirect=/admin");
  }
}
