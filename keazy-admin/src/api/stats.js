import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./client";

async function fetchStats() {
  return apiGet("/dashboard/stats");
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    staleTime: 5_000
  });
}