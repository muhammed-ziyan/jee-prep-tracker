import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useRevisionSchedule() {
  return useQuery({
    queryKey: [api.revision.list.path],
    queryFn: async () => {
      const res = await fetch(api.revision.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch revision schedule");
      return api.revision.list.responses[200].parse(await res.json());
    },
  });
}

type CreateRevisionInput = z.infer<typeof api.revision.create.input>;
type CreateRevisionsBatchInput = z.infer<typeof api.revision.createBatch.input>;

export function useCreateRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRevisionInput) => {
      const res = await fetch(api.revision.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create revision task");
      return api.revision.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.revision.list.path] });
    },
  });
}

export function useCreateRevisions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRevisionsBatchInput) => {
      const res = await fetch(api.revision.createBatch.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create revision tasks");
      return api.revision.createBatch.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.revision.list.path] });
    },
  });
}

export function useCompleteRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.revision.markComplete.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete revision");
      return api.revision.markComplete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.revision.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

type DeleteRevisionSessionInput = z.infer<typeof api.revision.deleteSession.input>;
type CompleteRevisionSessionInput = z.infer<typeof api.revision.completeSession.input>;

export function useDeleteRevisionSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DeleteRevisionSessionInput) => {
      const res = await fetch(api.revision.deleteSession.path, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete revision session");
      return api.revision.deleteSession.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.revision.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

export function useCompleteRevisionSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CompleteRevisionSessionInput) => {
      const res = await fetch(api.revision.completeSession.path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete revision session");
      return api.revision.completeSession.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.revision.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
