import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ message: "Bad request" }, { status: 400 });
  try {
    const supabase = createAdminClient();
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const u = userData.user;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, current_level, username")
      .eq("user_id", userId)
      .single();
    return NextResponse.json({
      id: u.id,
      email: u.email ?? null,
      user_metadata: u.user_metadata ?? {},
      created_at: u.created_at,
      role: (profile?.role as "admin" | "student") ?? "student",
      current_level: (profile?.current_level as "11" | "12") ?? undefined,
      username: profile?.username ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

const updateBodySchema = z.object({
  role: z.enum(["admin", "student"]).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  current_level: z.enum(["11", "12"]).optional(),
  username: z.string().max(100).optional().nullable(),
  user_metadata: z
    .object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      full_name: z.string().optional(),
      avatar_url: z.string().url().optional().nullable(),
    })
    .optional(),
});

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id: userId } = await params;
  if (!userId) {
    return NextResponse.json({ message: "Bad request" }, { status: 400 });
  }
  let body: z.infer<typeof updateBodySchema>;
  try {
    body = updateBodySchema.parse(await _request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: err.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }
    throw err;
  }
  try {
    const supabase = createAdminClient();

    if (
      body.email !== undefined ||
      body.user_metadata !== undefined ||
      body.username !== undefined ||
      body.password !== undefined
    ) {
      const authUpdate: { email?: string; password?: string; user_metadata?: Record<string, unknown> } = {};
      if (body.email !== undefined) authUpdate.email = body.email;
      if (body.password !== undefined) authUpdate.password = body.password;
      if (body.user_metadata !== undefined) authUpdate.user_metadata = body.user_metadata;
      if (body.username !== undefined) {
        const { data: existingUser } = await supabase.auth.admin.getUserById(userId);
        const existingMeta = (existingUser?.user?.user_metadata as Record<string, unknown>) ?? {};
        authUpdate.user_metadata = {
          ...existingMeta,
          ...(body.user_metadata ?? {}),
          username: body.username === "" ? undefined : body.username,
        };
      }
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, authUpdate);
      if (updateError) {
        console.error("Admin updateUserById error:", updateError);
        return NextResponse.json(
          { message: updateError.message ?? "Failed to update user" },
          { status: 400 }
        );
      }
    }

    const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.role !== undefined) profileUpdates.role = body.role;
    if (body.current_level !== undefined) profileUpdates.current_level = body.current_level;
    if (body.username !== undefined) profileUpdates.username = body.username === "" ? null : body.username;

    if (Object.keys(profileUpdates).length > 1) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("user_id", userId);
      if (profileError) {
        console.error("Admin profiles update error:", profileError);
        return NextResponse.json(
          { message: "Failed to update profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
