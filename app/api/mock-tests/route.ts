import { NextResponse } from "next/server";
import { getSessionUser } from "lib/get-session-user";
import { storage } from "server/storage";
import { api } from "@shared/routes";
import type { MockTestSubject } from "@shared/types";
import { z } from "zod";

function normalizeSubjects(
  subjects: unknown[]
): Partial<MockTestSubject>[] {
  return subjects.map((s) =>
    Object.fromEntries(
      Object.entries(s as Record<string, unknown>).map(([k, v]) => [k, v === null ? undefined : v])
    )
  ) as Partial<MockTestSubject>[];
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  const tests = await storage.getMockTests(userId);
  return NextResponse.json(tests);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  try {
    const body = await request.json();
    const input = api.mockTests.create.input.parse(body);
    const { test, subjects } = input;
    const normalizedSubjects = normalizeSubjects(subjects ?? []);
    const newTest = await storage.createMockTest({ ...test, userId }, normalizedSubjects);
    return NextResponse.json(newTest, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      return NextResponse.json({ message: msg || "Validation failed" }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Invalid data";
    console.error("Mock test create error:", err);
    return NextResponse.json(
      {
        message,
        hint: message.includes("column") && message.includes("does not exist")
          ? "Run the Supabase migration 20250131000003_mock_test_scope_negative.sql to add scope, unit_ids, and negative_marks columns."
          : undefined,
      },
      { status: 400 }
    );
  }
}
