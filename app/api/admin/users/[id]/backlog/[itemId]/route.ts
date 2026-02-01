import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const patchBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  type: z.enum(["concept", "practice", "forgetting"]).optional(),
  deadline: z.string().datetime().nullable().optional(),
  isCompleted: z.boolean().nullable().optional(),
  topicId: z.number().int().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { itemId } = await params;
  const iid = parseInt(itemId, 10);
  if (Number.isNaN(iid)) return NextResponse.json({ message: "Invalid itemId" }, { status: 400 });
  try {
    const body = patchBodySchema.parse(await request.json());
    const item = await adminStorage.adminUpdateBacklogItem(iid, body);
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(item);
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
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { itemId } = await params;
  const iid = parseInt(itemId, 10);
  if (Number.isNaN(iid)) return NextResponse.json({ message: "Invalid itemId" }, { status: 400 });
  try {
    await adminStorage.adminDeleteBacklogItem(iid);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
