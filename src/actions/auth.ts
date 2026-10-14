"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { compareDigest, requireAdmin, secureHash, signSessionToken } from "@/lib/session";
import { limitLogin } from "@/lib/ratelimit";

const SESSION_COOKIE = "registry_session";

export async function loginAction(formData: FormData): Promise<void> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const forwardedFor = (await headers()).get("x-forwarded-for") ?? "local";

  const { success } = await limitLogin(forwardedFor);
  if (!success) {
    throw new Error("Too many attempts. Please wait 10 minutes before trying again.");
  }

  const usernameMatch = compareDigest(
    secureHash(env.ADMIN_USERNAME).toString("hex"),
    secureHash(username).toString("hex"),
  );
  const passwordMatch = compareDigest(
    secureHash(env.ADMIN_PASSWORD).toString("hex"),
    secureHash(password).toString("hex"),
  );

  if (!usernameMatch || !passwordMatch) {
    throw new Error("Invalid username or password.");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await signSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logoutAction() {
  await requireAdmin();
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function checkAdminAccess() {
  await requireAdmin();
  return true;
}
