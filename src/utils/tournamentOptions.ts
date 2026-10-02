import type { TournamentSpeed, TournamentType } from "@/services/hooks/types";

export const tournamentTypes: { value: TournamentType; label: string }[] = [
  { value: "BOUNTY", label: "Bounty" },
  { value: "VANILLA", label: "Vanilla" },
];

export const tournamentSpeeds: { value: TournamentSpeed; label: string }[] = [
  { value: "REGULAR", label: "Regular" },
  { value: "TURBO", label: "Turbo" },
  { value: "HYPER", label: "Hyper" },
];

export function tournamentTypeLabel(type?: TournamentType | null): string {
  return tournamentTypes.find((t) => t.value === type)?.label ?? "-";
}

export function tournamentSpeedLabel(speed?: TournamentSpeed | null): string {
  return tournamentSpeeds.find((s) => s.value === speed)?.label ?? "-";
}
