import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import { storage } from "server/storage";
import * as adminStorage from "lib/supabase-admin-storage";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    await storage.seedSyllabus();
    // Use admin storage so class/level (is_class_11, is_class_12) and all fields are returned
    const data = await adminStorage.adminGetSubjectsWithUnitsAndTopics();
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
