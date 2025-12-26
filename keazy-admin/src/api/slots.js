import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "./client";

async function fetchSlots() { return apiGet("/dashboard/slots"); }
export function useSlots() { return useQuery({ queryKey: ["slots"], queryFn: fetchSlots }); }

export function useAddSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, time, available }) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/slots`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, available })
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries(["slots"])
  });
}
export function useEditSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date, time, available }) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/slots/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, available })
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries(["slots"])
  });
}