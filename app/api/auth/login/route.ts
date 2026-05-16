import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { signAuthToken } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/prisma";
import { logAuthFailure } from "@/lib/logger";
import { loginFailureResponse } from "@/lib/auth/login-errors";
import { loginSchema } from "@/lib/validations/api";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      void logAuthFailure(req, "Login failed — unknown email", {
        severity: "warn",
        meta: { reason: "unknown_user" },
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      void logAuthFailure(req, "Login failed — invalid password", {
        severity: "warn",
        userId: user.id,
        meta: { reason: "bad_password" },
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signAuthToken({
      sub: user.id,
      role: user.role,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? null,
        role: user.role,
        preferredVehicleSlug: user.preferredVehicleSlug ?? null,
      },
    });
    setAuthCookie(res, token);
    return res;
  } catch (e) {
    void logAuthFailure(req, "Login infrastructure failure", {
      severity: "error",
      error: e,
    });
    const { status, body } = loginFailureResponse(e);
    return NextResponse.json(body, { status });
  }
}
