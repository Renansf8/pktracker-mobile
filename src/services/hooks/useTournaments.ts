import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { apiClient } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import type { Tournament, TournamentSpeed, TournamentType } from "./types";
import { useGetUser } from "./useGetUser";

type UpdateTournamentInput = {
  id: string;
  data: Partial<Omit<Tournament, "id">>;
};

type BulkTournamentItem = Omit<Tournament, "id">;

export interface UseTournamentsFilters {
  platform?: string;
  page?: number;
  limit?: number;
  name?: string;
  type?: TournamentType | "";
  speed?: TournamentSpeed | "";
  minBuyIn?: number;
  maxBuyIn?: number;
}

export const useTournaments = (filters: UseTournamentsFilters = {}) => {
  const {
    platform = "",
    page = 1,
    limit = 20,
    name = "",
    type = "",
    speed = "",
    minBuyIn,
    maxBuyIn,
  } = filters;
  const queryClient = useQueryClient();
  const { refetch } = useGetUser();

  const getAllTournaments = useQuery({
    queryKey: [
      "tournaments",
      platform,
      page,
      limit,
      name,
      type,
      speed,
      minBuyIn,
      maxBuyIn,
    ],
    queryFn: () =>
      apiClient.get(
        API_ENDPOINTS.TOURNAMENTS.GET_ALL({
          platform,
          page,
          limit,
          name,
          type: type || undefined,
          speed: speed || undefined,
          minBuyIn,
          maxBuyIn,
        }),
      ),
  });

  const getDay2Tournaments = useQuery({
    queryKey: ["tournaments", "day2"],
    queryFn: () =>
      apiClient.get(
        API_ENDPOINTS.TOURNAMENTS.GET_ALL({ limit: 100, hasSecondDay: true }),
      ),
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["tournaments"] }),
      queryClient.invalidateQueries({ queryKey: ["stats"], refetchType: "all" }),
    ]);
    refetch();
  };

  const createTournament = useMutation({
    mutationFn: (data: Tournament) =>
      apiClient.post(API_ENDPOINTS.TOURNAMENTS.CREATE, data),
    onSuccess: async () => {
      await invalidateAll();
      Toast.show({ type: "success", text1: "Torneio registrado com sucesso" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao criar torneio" });
    },
  });

  const createManyTournaments = useMutation({
    mutationFn: async (tournaments: BulkTournamentItem[]) => {
      if (!tournaments.length) return;
      await apiClient.post(API_ENDPOINTS.TOURNAMENTS.BULK, { tournaments });
    },
    onSuccess: async () => {
      await invalidateAll();
      Toast.show({ type: "success", text1: "Grade adicionada com sucesso" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao adicionar grade" });
    },
  });

  const deleteTournament = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(API_ENDPOINTS.TOURNAMENTS.DELETE(id)),
    onSuccess: async () => {
      await invalidateAll();
      Toast.show({ type: "success", text1: "Torneio deletado com sucesso" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao deletar torneio" });
    },
  });

  const updateTournament = useMutation({
    mutationFn: ({ id, data }: UpdateTournamentInput) =>
      apiClient.patch(API_ENDPOINTS.TOURNAMENTS.UPDATE(id), data),
    onSuccess: async () => {
      await invalidateAll();
      Toast.show({ type: "success", text1: "Torneio atualizado com sucesso" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao atualizar torneio" });
    },
  });

  const applySchedule = useMutation({
    mutationFn: (scheduleId: string) =>
      apiClient.post(API_ENDPOINTS.SCHEDULES.APPLY(scheduleId)),
    onSuccess: async () => {
      await invalidateAll();
      Toast.show({ type: "success", text1: "Grade aplicada com sucesso" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao aplicar grade" });
    },
  });

  return {
    getAllTournaments,
    getDay2Tournaments,
    createTournament,
    createManyTournaments,
    deleteTournament,
    updateTournament,
    applySchedule,
  };
};
