import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import * as adminStorage from "lib/supabase-admin-storage";
import { z } from "zod";

const bodySchema = z.object({ name: z.string().min(1), color: z.string().min(1) });

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    const body = bodySchema.parse(await request.json());
    const subject = await adminStorage.adminCreateSubject(body);
    return NextResponse.json(subject, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.errors[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
