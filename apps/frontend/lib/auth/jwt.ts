import * as jose from "jose";

export type JwtPayload = {
  sub: string;
  role: "user" | "admin";
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: JwtPayload): Promise<string> {
  return new jose.SignJWT({
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAuthToken(token: string): Promise<JwtPayload> {
  const { payload } = await jose.jwtVerify(token, getSecret());
  const sub = payload.sub;
  const role = payload.role;
  if (!sub || (role !== "user" && role !== "admin")) {
    throw new Error("Invalid token payload");
  }
  return { sub, role };
}
