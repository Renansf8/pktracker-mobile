import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import type { User } from "../api/types";

export const useGetUser = () => {
  return useQuery<User, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await apiClient.get<User>(API_ENDPOINTS.USERS.ME);
      if (!response.data) {
        throw new Error("No user data received");
      }
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
