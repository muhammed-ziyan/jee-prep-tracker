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
  const data = await storage.getTopicProgress(userId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  try {
    const body = await request.json();
    const input = api.syllabus.updateProgress.input.parse(body);
    const updated = await storage.updateTopicProgress({ ...input, userId });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    throw err;
  }
}
