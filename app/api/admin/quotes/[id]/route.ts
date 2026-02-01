import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const updateBodySchema = z.object({
  quote: z.string().min(1).optional(),
  author: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
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
  const quoteId = parseInt(id, 10);
  if (Number.isNaN(quoteId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  try {
    const body = updateBodySchema.parse(await request.json());
    const quote = await adminStorage.adminUpdateMotivationalQuote(quoteId, body);
    return NextResponse.json(quote);
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
  const quoteId = parseInt(id, 10);
  if (Number.isNaN(quoteId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  try {
    await adminStorage.adminDeleteMotivationalQuote(quoteId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
