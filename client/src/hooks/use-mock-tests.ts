import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useMockTests() {
  return useQuery({
    queryKey: [api.mockTests.list.path],
    queryFn: async () => {
      const res = await fetch(api.mockTests.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch mock tests");
      return api.mockTests.list.responses[200].parse(await res.json());
    },
  });
}

type CreateMockTestInput = z.infer<typeof api.mockTests.create.input>;

export function useCreateMockTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMockTestInput) => {
      const res = await fetch(api.mockTests.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add mock test");
      return api.mockTests.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mockTests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

type UpdateMockTestInput = z.infer<typeof api.mockTests.update.input>;

export function useUpdateMockTest(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateMockTestInput) => {
      const path = buildUrl(api.mockTests.update.path, { id: testId });
      const res = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update mock test");
      return api.mockTests.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mockTests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
