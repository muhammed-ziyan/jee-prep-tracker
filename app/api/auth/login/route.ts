import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/login
 * Body: { identifier: string, password: string }
 * identifier can be email or username. Signs in and sets session cookie.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      );
    }

    let email: string;

    if (identifier.includes("@")) {
      email = identifier;
    } else {
      let admin;
      try {
        admin = createAdminClient();
      } catch (err) {
        console.error("Login with username requires SUPABASE_SERVICE_ROLE_KEY:", err);
        return NextResponse.json(
          { error: "Username login is not configured. Use your email to sign in, or set SUPABASE_SERVICE_ROLE_KEY in .env" },
          { status: 503 }
        );
      }
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("user_id")
        .ilike("username", identifier)
        .limit(1)
        .maybeSingle();

      if (profileError || !profile?.user_id) {
        return NextResponse.json(
          { error: "Invalid email/username or password" },
          { status: 401 }
        );
      }

      const { data: authUser, error: userError } = await admin.auth.admin.getUserById(
        profile.user_id
      );
      if (userError || !authUser?.user?.email) {
        return NextResponse.json(
          { error: "Invalid email/username or password" },
          { status: 401 }
        );
      }
      email = authUser.user.email;
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Invalid email/username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid email/username or password" },
      { status: 401 }
    );
  }
}
