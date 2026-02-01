import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const patchBodySchema = z.object({
  topicId: z.number().int().positive(),
  status: z.enum(["not_started", "in_progress", "completed"]).optional(),
  confidence: z.enum(["low", "medium", "high"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  lastRevisedAt: z.string().datetime().nullable().optional(),
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
    const progress = await adminStorage.adminGetTopicProgress(userId);
    return NextResponse.json(progress);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ message: "Bad request" }, { status: 400 });
  try {
    const body = patchBodySchema.parse(await request.json());
    const progress = await adminStorage.adminUpdateTopicProgress(userId, body);
    return NextResponse.json(progress);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.errors[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
