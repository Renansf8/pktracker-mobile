import type { Tournament } from "@/services/hooks/types";

function toN(v: unknown): number {
  if (typeof v === "string" && v.toLowerCase() === "ticket") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function getTournamentProfitNative(t: Tournament): number {
  return toN(t.result) - toN(t.buyIn);
}

export function getTournamentLucroUsd(t: Tournament, eurToUsdRate = 1): number {
  const val = getTournamentProfitNative(t);
  return t.currency === "EUR" ? val * eurToUsdRate : val;
}
