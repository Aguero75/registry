import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { errors, SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const SESSION_COOKIE = "registry_session";

export function secureHash(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function compareDigest(expected: string, candidate: string): boolean {
  const expectedBuffer = Buffer.from(expected, "hex");
  const candidateBuffer = Buffer.from(candidate, "hex");

  if (expectedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, candidateBuffer);
}

export function getCredentialFingerprint(): string {
  const value = `${env.ADMIN_USERNAME}:${env.ADMIN_PASSWORD}`;
  return createHash("sha256").update(value).digest("hex");
}

export async function signSessionToken() {
  const payload = {
    username: env.ADMIN_USERNAME,
    fingerprint: getCredentialFingerprint(),
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(env.SESSION_SECRET));
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(env.SESSION_SECRET));

    if (payload.username !== env.ADMIN_USERNAME) {
      return null;
    }

    if (payload.fingerprint !== getCredentialFingerprint()) {
      return null;
    }

    return payload;
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      return null;
    }
    throw error;
  }
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const verified = await verifySessionToken(token);

  if (!verified) {
    redirect("/admin/login");
  }

  return verified;
}
