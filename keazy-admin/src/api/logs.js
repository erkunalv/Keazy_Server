import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "./client";

async function fetchLogs() {
  return apiGet("/dashboard/logs");
}

export function useLogs() {
  return useQuery({ queryKey: ["logs"], queryFn: fetchLogs });
}

export function useApproveLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved_for_training }) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/logs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_for_training }),
      });
      if (!res.ok) throw new Error("Failed to update log");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries(["logs"]),
  });
}

export function useAssignService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assigned_service }) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/logs/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_service }),
      });
      if (!res.ok) throw new Error("Failed to assign service");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries(["logs"]),
  });
}