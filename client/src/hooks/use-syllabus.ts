import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

export function useSyllabus() {
  return useQuery({
    queryKey: [api.syllabus.list.path],
    queryFn: async () => {
      const res = await fetch(api.syllabus.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch syllabus");
      // The schema is recursive/complex, so we trust the API or use a looser validation if strict fails often
      // Using z.any() for the recursive structure for now as defined in routes.ts
      return api.syllabus.list.responses[200].parse(await res.json());
    },
  });
}

export function useSyllabusProgress() {
  return useQuery({
    queryKey: [api.syllabus.getProgress.path],
    queryFn: async () => {
      const res = await fetch(api.syllabus.getProgress.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return api.syllabus.getProgress.responses[200].parse(await res.json());
    },
  });
}

type UpdateProgressInput = z.infer<typeof api.syllabus.updateProgress.input>;

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProgressInput) => {
      const res = await fetch(api.syllabus.updateProgress.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return api.syllabus.updateProgress.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.syllabus.getProgress.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
