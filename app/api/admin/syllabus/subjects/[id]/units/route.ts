import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const bodySchema = z.object({ name: z.string().min(1), order: z.number().int().min(0) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const subjectId = parseInt(id, 10);
  if (Number.isNaN(subjectId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  try {
    const body = bodySchema.parse(await request.json());
    const unit = await adminStorage.adminCreateUnit(subjectId, body);
    return NextResponse.json(unit, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.errors[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
