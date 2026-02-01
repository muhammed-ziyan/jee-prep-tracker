import { NextResponse } from "next/server";
import { getSessionUser } from "lib/get-session-user";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/** Standard 403 response for admin-only routes. */
export function adminForbiddenResponse(): NextResponse {
  return NextResponse.json(
    { message: "Forbidden", code: "ADMIN_REQUIRED" },
    { status: 403 }
  );
}

/**
 * Returns the current session user if they are an admin, otherwise null.
 * Admin = email in ADMIN_EMAILS (comma-separated) OR profiles.role = 'admin'.
 */
export async function getAdminUser(): Promise<SupabaseUser | null> {
  const user = await getSessionUser();
  if (!user?.id) return null;

  const adminEmails = process.env.ADMIN_EMAILS;
  if (adminEmails?.length && user.email) {
    const emails = adminEmails.split(",").map((e) => e.trim().toLowerCase());
    if (emails.includes(user.email.toLowerCase())) return user;
  }

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (profile?.role === "admin") return user;
  } catch {
    // profiles table may not exist or RLS; treat as non-admin
  }
  return null;
}
