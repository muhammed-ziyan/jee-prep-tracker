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

const postBodySchema = z.object({
  title: z.string().min(1),
  testDate: z.string(),
  totalScore: z.number().int().min(0),
  maxScore: z.number().int().min(0),
  notes: z.string().nullable().optional(),
  subjects: z.array(subjectSchema).min(1),
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
    const tests = await adminStorage.adminGetMockTests(userId);
    return NextResponse.json(tests);
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
    const test = await adminStorage.adminCreateMockTest(
      userId,
      {
        title: body.title,
        testDate: body.testDate,
        totalScore: body.totalScore,
        maxScore: body.maxScore,
        notes: body.notes ?? null,
      },
      body.subjects
    );
    return NextResponse.json(test, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.errors[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
