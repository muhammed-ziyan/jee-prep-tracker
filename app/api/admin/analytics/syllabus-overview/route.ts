import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  try {
    const data = await adminStorage.adminGetSyllabusOverview();
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
