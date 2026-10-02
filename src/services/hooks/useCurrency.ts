import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";

export const useCurrency = () => {
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => apiClient.get(API_ENDPOINTS.CURRENCIES.GET_ALL),

    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });

  return {
    currencies,
  };
};
