// Reaproveitado do pktracker-front
export type TournamentType = "BOUNTY" | "VANILLA";
export type TournamentSpeed = "REGULAR" | "TURBO" | "HYPER";

export interface Tournament {
  id?: string;
  date: string;
  platform: string;
  name: string;
  currency: string;
  buyIn: number | string;
  result: number | string;
  profit?: number;
  itm?: boolean;
  hasFt?: boolean;
  hasSecondDay?: boolean;
  position?: number | null;
  type?: TournamentType | null;
  speed?: TournamentSpeed | null;
}

export interface PaginatedTournamentsResponse {
  data: Tournament[];
  totalPages: number;
  total: number;
  totalProfit?: number;
}

export interface Deposit {
  date: string;
  amount: number;
}

export interface Withdrawal {
  date: string;
  amount: number;
}

export interface Rake {
  date: string;
  amount: number;
  platform?: string;
}

export interface StatsTournamentRef {
  id: string;
  name: string;
  platform: string;
  date: string;
}

export interface StatsBiggestBuyIn {
  value: number;
  tournament: StatsTournamentRef;
}

export interface StatsBucketRecord {
  bucketStart: string;
  amount: number;
}

export type StatsBucketRange = "day" | "week" | "month" | "year";

export type StatsBucketRecords = {
  [K in StatsBucketRange]: StatsBucketRecord | null;
};

export interface StatsMostTournamentsInADay {
  date: string;
  count: number;
}

export interface StatsHighestAbiDay {
  date: string;
  abi: number;
  tournaments: number;
}

export interface StatsSummary {
  biggestBuyIn: StatsBiggestBuyIn | null;
  profitRecords: StatsBucketRecords;
  lossRecords: StatsBucketRecords;
  mostTournamentsInADay: StatsMostTournamentsInADay | null;
  highestAbiDay: StatsHighestAbiDay | null;
}
