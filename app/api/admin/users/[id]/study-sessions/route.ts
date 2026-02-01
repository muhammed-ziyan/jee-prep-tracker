import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const postBodySchema = z.object({
  subjectId: z.number().int().nullable().optional(),
  durationMinutes: z.number().int().min(1),
  date: z.string(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ message: "Bad request" }, { status: 400 });
  try {
    const sessions = await adminStorage.adminGetStudySessions(userId);
    return NextResponse.json(sessions);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ message: "Bad request" }, { status: 400 });
  try {
    const body = postBodySchema.parse(await request.json());
    const session = await adminStorage.adminCreateStudySession(userId, body);
    return NextResponse.json(session, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.errors[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
