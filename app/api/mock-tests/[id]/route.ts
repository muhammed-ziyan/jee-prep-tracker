import { NextResponse } from "next/server";
import { getSessionUser } from "lib/get-session-user";
import { storage } from "server/storage";
import { api } from "@shared/routes";
import type { MockTestSubject } from "@shared/types";
import { z } from "zod";

function normalizeSubjects(subjects: unknown[]): Partial<MockTestSubject>[] {
  return subjects.map((s) =>
    Object.fromEntries(
      Object.entries(s as Record<string, unknown>).map(([k, v]) => [k, v === null ? undefined : v])
    )
  ) as Partial<MockTestSubject>[];
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const input = api.mockTests.update.input.parse(body);
    const { test, subjects } = input;
    const normalizedSubjects = normalizeSubjects(subjects ?? []);
    const updated = await storage.updateMockTest(id, test ?? {}, normalizedSubjects);
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      return NextResponse.json({ message: msg || "Validation failed" }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Invalid data";
    console.error("Mock test update error:", err);
    return NextResponse.json({ message }, { status: 400 });
  }
}
