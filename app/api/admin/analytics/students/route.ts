import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  try {
    const data = await adminStorage.adminGetAnalyticsStudents({ from, to });
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
