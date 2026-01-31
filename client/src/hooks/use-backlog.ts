import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useBacklog() {
  return useQuery({
    queryKey: [api.backlog.list.path],
    queryFn: async () => {
      const res = await fetch(api.backlog.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch backlog");
      return api.backlog.list.responses[200].parse(await res.json());
    },
  });
}

type CreateBacklogInput = z.infer<typeof api.backlog.create.input>;

export function useCreateBacklog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBacklogInput) => {
      const res = await fetch(api.backlog.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create backlog item");
      return api.backlog.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.backlog.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

type UpdateBacklogInput = z.infer<typeof api.backlog.update.input>;

export function useUpdateBacklog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateBacklogInput) => {
      const url = buildUrl(api.backlog.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update backlog item");
      return api.backlog.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.backlog.list.path] });
    },
  });
}

export function useDeleteBacklog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.backlog.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete backlog item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.backlog.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
