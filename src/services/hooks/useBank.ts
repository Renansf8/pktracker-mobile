import { useMutation } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { apiClient } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import type { Deposit, Rake, Withdrawal } from "./types";
import { useGetUser } from "./useGetUser";

export const useBank = () => {
  const { refetch } = useGetUser();

  const createDeposit = useMutation({
    mutationFn: (data: Deposit) =>
      apiClient.post(API_ENDPOINTS.BANK.CREATE_DEPOSIT, data),
    onSuccess: () => {
      refetch();
      Toast.show({ type: "success", text1: "Depósito criado com sucesso" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao criar depósito" });
    },
  });

  const createWithdrawal = useMutation({
    mutationFn: (data: Withdrawal) =>
      apiClient.post(API_ENDPOINTS.BANK.CREATE_WITHDRAWAL, data),
    onSuccess: () => {
      refetch();
      Toast.show({ type: "success", text1: "Saque criado com sucesso" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao criar saque" });
    },
  });

  const createRake = useMutation({
    mutationFn: (data: Rake) =>
      apiClient.post(API_ENDPOINTS.BANK.CREATE_RAKE, data),
    onSuccess: () => {
      refetch();
      Toast.show({ type: "success", text1: "Rake registrado com sucesso" });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Erro ao registrar rake" });
    },
  });

  return { createDeposit, createWithdrawal, createRake };
};
