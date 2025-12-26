import { useQuery } from "@tanstack/react-query";
// import { apiGet } from "./client"; // uncomment when wiring real API

// Mock data for now
const mockLogs = [
  { _id: "1", query_text: "install tap", predicted_service: "plumber", confidence: 0.76, urgency: "normal", approved_for_training: true, created_at: "2025-12-20T06:30:00Z" },
  { _id: "2", query_text: "fix wiring", predicted_service: "electrician", confidence: 0.65, urgency: "high", approved_for_training: false, created_at: "2025-12-20T06:32:00Z" }
];

async function fetchLogsMock() {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 400));
  return mockLogs;
}

// When backend route is ready:
// async function fetchLogsReal() {
//   return apiGet("/dashboard/logs");
// }

export function useQueryLogs() {
  return useQuery({
    queryKey: ["query_logs"],
    queryFn: fetchLogsMock, // swap to fetchLogsReal later
    staleTime: 5_000
  });
}