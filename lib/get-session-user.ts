import { createClient } from "@/lib/supabase/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User } from "@shared/models/auth";

export async function getSessionUser(): Promise<SupabaseUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Map Supabase user to app User shape for /api/auth/user and UI */
export function mapSupabaseUserToAppUser(supabaseUser: SupabaseUser): User {
  const meta = supabaseUser.user_metadata ?? {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? null,
    firstName: (meta.first_name as string) ?? (meta.full_name as string) ?? null,
    lastName: (meta.last_name as string) ?? null,
    profileImageUrl: (meta.avatar_url as string) ?? null,
    createdAt: null,
    updatedAt: null,
  };
}
