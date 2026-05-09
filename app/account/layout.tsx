import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";

import { AUTH_COOKIE } from "@/lib/constants";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect("/login?redirect=/account");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    redirect("/login?redirect=/account");
  }

  try {
    await jose.jwtVerify(token, new TextEncoder().encode(secret));
  } catch {
    redirect("/login?redirect=/account");
  }

  return children;
}
