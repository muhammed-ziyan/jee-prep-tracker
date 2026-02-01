import { NextResponse } from "next/server";
import { getSessionUser } from "lib/get-session-user";
import { storage } from "server/storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  try {
    const body = await request.json();
    const input = api.revision.createBatch.input.parse(body);
    const items = await Promise.all(
      input.topicIds.map((topicId) =>
        storage.createRevisionSchedule({
          userId,
          topicId,
          scheduledDate: input.scheduledDate,
          status: "not_started",
        })
      )
    );
    return NextResponse.json(items, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    throw err;
  }
}
