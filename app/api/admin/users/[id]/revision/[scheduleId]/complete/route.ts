import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { scheduleId } = await params;
  const sid = parseInt(scheduleId, 10);
  if (Number.isNaN(sid)) return NextResponse.json({ message: "Invalid scheduleId" }, { status: 400 });
  try {
    const schedule = await adminStorage.adminCompleteRevision(sid);
    if (!schedule) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(schedule);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
