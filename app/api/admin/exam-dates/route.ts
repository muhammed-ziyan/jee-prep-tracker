import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const createBodySchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  displayOrder: z.number().int().optional(),
});

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    const list = await adminStorage.adminListExamDates();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    const body = createBodySchema.parse(await request.json());
    const exam = await adminStorage.adminCreateExamDate({
      name: body.name,
      examDate: body.examDate,
      displayOrder: body.displayOrder,
    });
    return NextResponse.json(exam, { status: 201 });
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
