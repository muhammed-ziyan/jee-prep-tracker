import { NextResponse } from "next/server";
import { getSessionUser, mapSupabaseUserToAppUser } from "lib/get-session-user";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const appUser = mapSupabaseUserToAppUser(user);
  return NextResponse.json(appUser);
}
