import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const patchBodySchema = z.object({
  durationMinutes: z.number().int().min(1).optional(),
  date: z.string().optional(),
  notes: z.string().nullable().optional(),
  subjectId: z.number().int().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { sessionId } = await params;
  const sid = parseInt(sessionId, 10);
  if (Number.isNaN(sid)) return NextResponse.json({ message: "Invalid sessionId" }, { status: 400 });
  try {
    const body = patchBodySchema.parse(await request.json());
    const session = await adminStorage.adminUpdateStudySession(sid, body);
    return NextResponse.json(session);
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
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { sessionId } = await params;
  const sid = parseInt(sessionId, 10);
  if (Number.isNaN(sid)) return NextResponse.json({ message: "Invalid sessionId" }, { status: 400 });
  try {
    await adminStorage.adminDeleteStudySession(sid);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
