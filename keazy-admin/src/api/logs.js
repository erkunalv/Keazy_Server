import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "./client";

async function fetchLogs() {
  return apiGet("/dashboard/logs");
}

export function useLogs() {
  return useQuery({ queryKey: ["logs"], queryFn: fetchLogs });
}

// Alias for QueryLogsPage compatibility
export const useQueryLogs = useLogs;

// Fetch ML Logs with optional filters
export async function getMLLogs(params = {}) {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:3000";
  
  // Build query string from params
  const queryParams = new URLSearchParams();
  if (params.service) queryParams.append("service", params.service);
  if (params.min_confidence) queryParams.append("min_confidence", params.min_confidence);
  if (params.date_from) queryParams.append("date_from", params.date_from);
  if (params.date_to) queryParams.append("date_to", params.date_to);

  const url = `${API_BASE}/dashboard/ml-logs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ML logs: ${res.statusText}`);
    return res.json();
  } catch (err) {
    console.error("Error fetching ML logs:", err);
    throw err;
  }
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