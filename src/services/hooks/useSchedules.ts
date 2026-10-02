import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import Toast from "react-native-toast-message";

export type ScheduleType = "WEEKLY" | "SUNDAY";

export interface TournamentSchedule {
  id: string;
  name: string;
  type: ScheduleType;
}

export const useSchedules = (type?: ScheduleType) => {
  const queryClient = useQueryClient();

  const getSchedules = useQuery({
    queryKey: ["schedules", type ?? "all"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.SCHEDULES.GET_ALL(type));
      return res.data;
    },
  });

  const createSchedule = useMutation({
    mutationFn: (data: { name: string; type: ScheduleType }) =>
      apiClient.post(API_ENDPOINTS.SCHEDULES.CREATE, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["schedules"] });
      Toast.show({ type: "success", text1: "Grade criada" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao criar grade" });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(API_ENDPOINTS.SCHEDULES.DELETE(id)),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["schedules"] });
      Toast.show({ type: "success", text1: "Grade removida" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao remover grade" });
    },
  });

  const schedules: TournamentSchedule[] = (() => {
    const raw = getSchedules.data;
    return (Array.isArray(raw) ? raw : (raw as { data?: TournamentSchedule[] })?.data ?? []);
  })();

  return { getSchedules, schedules, createSchedule, deleteSchedule };
};
