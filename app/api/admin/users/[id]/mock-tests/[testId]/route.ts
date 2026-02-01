import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const subjectSchema = z.object({
  subjectId: z.number().int().positive(),
  score: z.number().int().min(0),
  maxScore: z.number().int().min(0).optional().nullable(),
  correctCount: z.number().int().optional().nullable(),
  incorrectCount: z.number().int().optional().nullable(),
  unattemptedCount: z.number().int().optional().nullable(),
});

const patchBodySchema = z.object({
  title: z.string().min(1).optional(),
  testDate: z.string().optional(),
  totalScore: z.number().int().min(0).optional(),
  maxScore: z.number().int().min(0).optional(),
  notes: z.string().nullable().optional(),
  subjects: z.array(subjectSchema).min(1).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id: userId, testId } = await params;
  if (!userId || !testId) return NextResponse.json({ message: "Bad request" }, { status: 400 });
  try {
    const body = patchBodySchema.parse(await request.json());
    const { subjects, ...testUpdates } = body;
    const test = await adminStorage.adminUpdateMockTest(
      testId,
      userId,
      testUpdates,
      subjects ?? []
    );
    return NextResponse.json(test);
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
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { testId } = await params;
  if (!testId) return NextResponse.json({ message: "Bad request" }, { status: 400 });
  try {
    await adminStorage.adminDeleteMockTest(testId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
