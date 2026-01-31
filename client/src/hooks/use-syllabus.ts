import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

export type SyllabusScope = "class_11" | "class_12" | "whole";

export function useSyllabus(scope?: SyllabusScope) {
  const url =
    scope && scope !== "whole"
      ? `${api.syllabus.list.path}?scope=${encodeURIComponent(scope)}`
      : api.syllabus.list.path;
  return useQuery({
    queryKey: [api.syllabus.list.path, scope ?? "whole"],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch syllabus");
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
  });
}
