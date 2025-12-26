import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "./client";

// ------------------- Fetch Users -------------------
async function fetchUsers() {
  return apiGet("/dashboard/users");
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5_000
  });
}

// ------------------- Add User -------------------
export function useAddUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, phone, email, approved }) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, approved })
      });
      if (!res.ok) throw new Error("Failed to add user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
    }
  });
}

// ------------------- Toggle Approval -------------------
export function useToggleUserApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved })
      });
      if (!res.ok) throw new Error("Failed to update user approval");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
    }
  });
}

// ------------------- Edit User -------------------
export function useEditUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, phone, email, approved }) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, approved })
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
    }
  });
}