import { NextResponse } from "next/server";
import { getAdminUser } from "lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export type AdminUserRow = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
  created_at: string;
  role: "admin" | "student";
  current_level?: "11" | "12";
  username?: string | null;
};

const createBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.enum(["admin", "student"]).optional(),
  current_level: z.enum(["11", "12"]).optional(),
  username: z.string().max(100).optional(),
});

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    const supabase = createAdminClient();
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (authError) {
      console.error("Admin listUsers error:", authError);
      return NextResponse.json({ message: "Failed to list users" }, { status: 500 });
    }
    const users = authData.users ?? [];
    const userIds = users.map((u) => u.id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, role, current_level, username")
      .in("user_id", userIds);
    const profileByUserId = new Map(
      (profiles ?? []).map((p) => [
        p.user_id,
        {
          role: (p.role as "admin" | "student") ?? "student",
          current_level: p.current_level as "11" | "12" | undefined,
          username: p.username ?? null,
        },
      ])
    );
    const rows: AdminUserRow[] = users.map((u) => {
      const prof = profileByUserId.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        user_metadata: u.user_metadata ?? {},
        created_at: u.created_at,
        role: prof?.role ?? "student",
        current_level: prof?.current_level,
        username: prof?.username ?? null,
      };
    });
    return NextResponse.json({ users: rows });
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
  let body: z.infer<typeof createBodySchema>;
  try {
    body = createBodySchema.parse(await request.json());
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
    const userMetadata: Record<string, unknown> = {};
    if (body.first_name !== undefined) userMetadata.first_name = body.first_name;
    if (body.last_name !== undefined) userMetadata.last_name = body.last_name;
    if (body.username !== undefined && body.username.trim()) userMetadata.username = body.username.trim();

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: body.email.trim(),
      password: body.password,
      email_confirm: true,
      user_metadata: Object.keys(userMetadata).length ? userMetadata : undefined,
    });
    if (createError) {
      console.error("Admin createUser error:", createError);
      return NextResponse.json(
        { message: createError.message ?? "Failed to create user" },
        { status: 400 }
      );
    }
    if (!newUser?.user?.id) {
      return NextResponse.json({ message: "User created but no id returned" }, { status: 500 });
    }

    const role = body.role ?? "student";
    const current_level = body.current_level ?? "11";
    const username = body.username?.trim() || null;
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: newUser.user.id,
        role,
        current_level,
        username,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (profileError) {
      console.error("Admin profile upsert after create error:", profileError);
      return NextResponse.json(
        { message: "User created but failed to set profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: newUser.user.id,
      email: newUser.user.email ?? null,
      message: "User created",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
