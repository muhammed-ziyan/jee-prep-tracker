import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const patchBodySchema = z.object({
  scheduledDate: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]).optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { scheduleId } = await params;
  const sid = parseInt(scheduleId, 10);
  if (Number.isNaN(sid)) return NextResponse.json({ message: "Invalid scheduleId" }, { status: 400 });
  try {
    const body = patchBodySchema.parse(await request.json());
    const schedule = await adminStorage.adminUpdateRevisionSchedule(sid, body);
    return NextResponse.json(schedule);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.errors[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { scheduleId } = await params;
  const sid = parseInt(scheduleId, 10);
  if (Number.isNaN(sid)) return NextResponse.json({ message: "Invalid scheduleId" }, { status: 400 });
  try {
    await adminStorage.adminDeleteRevisionSchedule(sid);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
