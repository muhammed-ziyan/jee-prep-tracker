"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

async function fetchAdminUser(): Promise<User | null> {
  const res = await fetch("/api/admin/me", { credentials: "include" });
  if (res.status === 403) return null;
  if (!res.ok) throw new Error("Failed to fetch admin status");
  const data = await res.json();
  return data.user ?? null;
}

export function useAdmin() {
  const { data: adminUser, isLoading } = useQuery<User | null>({
    queryKey: ["/api/admin/me"],
    queryFn: fetchAdminUser,
    retry: false,
    staleTime: 1000 * 60 * 2,
  });
  return {
    isAdmin: !!adminUser,
    adminUser: adminUser ?? null,
    isLoading,
  };
}
