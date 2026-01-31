import { NextResponse } from "next/server";
import { getSessionUser } from "lib/get-session-user";
import { storage } from "server/storage";
import type { SyllabusScope } from "lib/supabase-storage";

const VALID_SCOPES: SyllabusScope[] = ["class_11", "class_12", "whole"];

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await storage.seedSyllabus();
  const scopeParam = new URL(request.url).searchParams.get("scope");
  const scope: SyllabusScope | undefined =
    scopeParam && VALID_SCOPES.includes(scopeParam as SyllabusScope)
      ? (scopeParam as SyllabusScope)
      : undefined;
  const data = await storage.getSubjectsWithUnitsAndTopics(scope);
  return NextResponse.json(data);
}
