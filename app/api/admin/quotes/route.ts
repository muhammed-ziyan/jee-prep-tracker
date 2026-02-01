import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const createBodySchema = z.object({
  quote: z.string().min(1, "Quote text is required"),
  author: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    const list = await adminStorage.adminListMotivationalQuotes();
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
    const quote = await adminStorage.adminCreateMotivationalQuote({
      quote: body.quote,
      author: body.author ?? null,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
    });
    return NextResponse.json(quote, { status: 201 });
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
