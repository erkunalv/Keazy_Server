import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "./client";

async function fetchServices() {
  return apiGet("/dashboard/services");
}

export function useServices() {
  return useQuery({ queryKey: ["services"], queryFn: fetchServices, staleTime: 5000 });
}

export function useAddService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/services`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to add service");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries(["services"]),
  });
}

export function useEditService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, description }) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/services/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries(["services"]),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete service");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries(["services"]),
  });
}