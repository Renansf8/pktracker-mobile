import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import type { PaginatedTournamentsResponse, StatsSummary } from "./types";

export const useStats = () => {
  const getStatsSummary = useQuery<StatsSummary>({
    queryKey: ["stats", "summary"],
    queryFn: async () => {
      const res = await apiClient.get<StatsSummary>(API_ENDPOINTS.STATS.SUMMARY);
      return res.data;
    },
  });

  const getAllTournamentsForStats = useQuery<PaginatedTournamentsResponse>({
    queryKey: ["stats", "platform-tournaments"],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedTournamentsResponse>(
        API_ENDPOINTS.TOURNAMENTS.GET_ALL({ limit: 9999 }),
      );
      return res.data;
    },
  });

  return { getStatsSummary, getAllTournamentsForStats };
};
