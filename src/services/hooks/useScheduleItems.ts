import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import Toast from "react-native-toast-message";

export interface TournamentScheduleItem {
  id: string;
  scheduleId?: string;
  time: string;
  platform: string;
  name: string;
  currency: string;
  buyIn: number | string;
}

export const useScheduleItems = (scheduleId: string | null) => {
  const queryClient = useQueryClient();

  const getItems = useQuery({
    queryKey: ["schedule-items", scheduleId],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.SCHEDULES.ITEMS.GET_ALL(scheduleId!));
      return res.data;
    },
    enabled: !!scheduleId,
  });

  const createItem = useMutation({
    mutationFn: (data: Omit<TournamentScheduleItem, "id" | "scheduleId">) =>
      apiClient.post(API_ENDPOINTS.SCHEDULES.ITEMS.CREATE(scheduleId!), data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["schedule-items", scheduleId] });
      Toast.show({ type: "success", text1: "Torneio adicionado" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao adicionar torneio" });
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TournamentScheduleItem> }) =>
      apiClient.patch(API_ENDPOINTS.SCHEDULES.ITEMS.UPDATE(scheduleId!, id), data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["schedule-items", scheduleId] });
      Toast.show({ type: "success", text1: "Torneio atualizado" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao atualizar torneio" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(API_ENDPOINTS.SCHEDULES.ITEMS.DELETE(scheduleId!, id)),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["schedule-items", scheduleId] });
      Toast.show({ type: "success", text1: "Torneio removido" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao remover torneio" });
    },
  });

  const items: TournamentScheduleItem[] = (() => {
    const raw = getItems.data;
    return (Array.isArray(raw) ? raw : (raw as { data?: TournamentScheduleItem[] })?.data ?? []);
  })();

  return { getItems, items, createItem, updateItem, deleteItem };
};
