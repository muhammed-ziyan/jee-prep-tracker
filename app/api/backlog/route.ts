import { NextResponse } from "next/server";
import { getSessionUser } from "lib/get-session-user";
import { storage } from "server/storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  const items = await storage.getBacklogItems(userId);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  try {
    const body = await request.json();
    const input = api.backlog.create.input.parse(body);
    const item = await storage.createBacklogItem({ ...input, userId });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    throw err;
  }
}
