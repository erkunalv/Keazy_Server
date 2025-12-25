import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./client";

export function useModelStatus() {
  return useQuery({
    queryKey: ["modelStatus"],
    queryFn: () => apiGet("/dashboard/model/status"),
  });
}