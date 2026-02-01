import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const bodySchema = z.object({ name: z.string().min(1).optional(), order: z.number().int().min(0).optional() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const unitId = parseInt(id, 10);
  if (Number.isNaN(unitId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  try {
    const body = bodySchema.parse(await request.json());
    const unit = await adminStorage.adminUpdateUnit(unitId, body);
    return NextResponse.json(unit);
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
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const unitId = parseInt(id, 10);
  if (Number.isNaN(unitId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  try {
    await adminStorage.adminDeleteUnit(unitId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
