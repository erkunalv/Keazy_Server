import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "./client";

export function useRetrainHistory() {
  return useQuery({
    queryKey: ["retrainHistory"],
    queryFn: () => apiGet("/dashboard/retrain/history"),
  });
}

export function useRetrainModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/retrain`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Retrain failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries(["retrainHistory"]);
    },
  });
}
