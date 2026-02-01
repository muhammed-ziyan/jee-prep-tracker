import { NextResponse } from "next/server";
import { getAdminUser, adminForbiddenResponse } from "lib/admin-auth";
import { mapSupabaseUserToAppUser } from "lib/get-session-user";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return adminForbiddenResponse();
  return NextResponse.json({ user: mapSupabaseUserToAppUser(user) });
}
