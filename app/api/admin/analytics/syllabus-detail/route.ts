import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ message: "userId query parameter is required" }, { status: 400 });
  }
  try {
    const data = await adminStorage.adminGetSyllabusDetail(userId);
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
