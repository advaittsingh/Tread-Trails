import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getOptionalAuth } from "@/lib/auth/request-user";

export async function GET() {
  const auth = await getOptionalAuth();
  if (!auth) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    await connectDB();
    const user = await User.findById(auth.userId).lean();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}
