import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  displayOrder: z.number().int().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const examId = parseInt(id, 10);
  if (Number.isNaN(examId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  try {
    const body = updateBodySchema.parse(await request.json());
    const exam = await adminStorage.adminUpdateExamDate(examId, body);
    return NextResponse.json(exam);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: e.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const examId = parseInt(id, 10);
  if (Number.isNaN(examId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  try {
    await adminStorage.adminDeleteExamDate(examId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
