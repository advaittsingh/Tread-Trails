import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { signAuthToken } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/session-cookie";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
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
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signAuthToken({
      sub: user._id.toString(),
      role: user.role as "user" | "admin",
    });

    const res = NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    setAuthCookie(res, token);
    return res;
  } catch (e) {
    const { status, body } = loginFailureResponse(e);
    return NextResponse.json(body, { status });
  }
}
