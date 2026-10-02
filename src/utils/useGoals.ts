import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

const KEYS = {
  MONTHLY_GOAL: "pk_monthly_goal",
  ANNUAL_GOAL: "pk_annual_goal",
  MONTHLY_SNAPSHOT: "pk_monthly_snap",
  ANNUAL_SNAPSHOT: "pk_annual_snap",
  PREV_MONTH: "pk_prev_month",
  PREV_YEAR: "pk_prev_year",
} as const;

interface StoredMonthlyGoal { value: number; month: string }
interface StoredAnnualGoal { value: number; year: number }
interface StoredMonthlySnapshot { month: string; profit: number }
interface StoredAnnualSnapshot { year: number; profit: number }

export interface PrevMonthSummary { month: string; goal: number; achieved: number; met: boolean }
export interface PrevYearSummary { year: number; goal: number; achieved: number; met: boolean }

export interface GoalsState {
  monthlyGoal: number | null;
  annualGoal: number | null;
  prevMonthSummary: PrevMonthSummary | null;
  prevYearSummary: PrevYearSummary | null;
  setMonthlyGoal: (value: number) => void;
  setAnnualGoal: (value: number) => void;
  clearMonthlyGoal: () => void;
  clearAnnualGoal: () => void;
}

async function readStore<T>(key: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeStore<T>(key: string, value: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch {
    // storage unavailable
  }
}

async function deleteStore(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getYear(): number {
  return new Date().getFullYear();
}

export function useGoals(
  monthlyProfitUsd: number,
  yearlyProfitUsd: number,
): GoalsState {
  const [monthlyGoal, setMonthlyGoalState] = useState<number | null>(null);
  const [annualGoal, setAnnualGoalState] = useState<number | null>(null);
  const [prevMonthSummary, setPrevMonthSummary] = useState<PrevMonthSummary | null>(null);
  const [prevYearSummary, setPrevYearSummary] = useState<PrevYearSummary | null>(null);

  useEffect(() => {
    async function init() {
      const curMonth = getMonthKey();
      const curYear = getYear();

      const storedMonthly = await readStore<StoredMonthlyGoal>(KEYS.MONTHLY_GOAL);
      if (storedMonthly) {
        if (storedMonthly.month === curMonth) {
          setMonthlyGoalState(storedMonthly.value);
        } else {
          const snap = await readStore<StoredMonthlySnapshot>(KEYS.MONTHLY_SNAPSHOT);
          const achieved = snap?.month === storedMonthly.month ? snap.profit : 0;
          const summary: PrevMonthSummary = {
            month: storedMonthly.month,
            goal: storedMonthly.value,
            achieved,
            met: achieved >= storedMonthly.value,
          };
          await writeStore(KEYS.PREV_MONTH, summary);
          await deleteStore(KEYS.MONTHLY_GOAL);
          await deleteStore(KEYS.MONTHLY_SNAPSHOT);
        }
      }

      const storedAnnual = await readStore<StoredAnnualGoal>(KEYS.ANNUAL_GOAL);
      if (storedAnnual) {
        if (storedAnnual.year === curYear) {
          setAnnualGoalState(storedAnnual.value);
        } else {
          const snap = await readStore<StoredAnnualSnapshot>(KEYS.ANNUAL_SNAPSHOT);
          const achieved = snap?.year === storedAnnual.year ? snap.profit : 0;
          const summary: PrevYearSummary = {
            year: storedAnnual.year,
            goal: storedAnnual.value,
            achieved,
            met: achieved >= storedAnnual.value,
          };
          await writeStore(KEYS.PREV_YEAR, summary);
          await deleteStore(KEYS.ANNUAL_GOAL);
          await deleteStore(KEYS.ANNUAL_SNAPSHOT);
        }
      }

      const pm = await readStore<PrevMonthSummary>(KEYS.PREV_MONTH);
      if (pm) setPrevMonthSummary(pm);

      const py = await readStore<PrevYearSummary>(KEYS.PREV_YEAR);
      if (py) setPrevYearSummary(py);
    }

    init();
  }, []);

  useEffect(() => {
    async function syncSnapshots() {
      const curMonth = getMonthKey();
      const curYear = getYear();

      const storedMonthly = await readStore<StoredMonthlyGoal>(KEYS.MONTHLY_GOAL);
      if (storedMonthly?.month === curMonth) {
        await writeStore<StoredMonthlySnapshot>(KEYS.MONTHLY_SNAPSHOT, {
          month: curMonth,
          profit: monthlyProfitUsd,
        });
      }

      const storedAnnual = await readStore<StoredAnnualGoal>(KEYS.ANNUAL_GOAL);
      if (storedAnnual?.year === curYear) {
        await writeStore<StoredAnnualSnapshot>(KEYS.ANNUAL_SNAPSHOT, {
          year: curYear,
          profit: yearlyProfitUsd,
        });
      }
    }

    syncSnapshots();
  }, [monthlyProfitUsd, yearlyProfitUsd]);

  const setMonthlyGoal = useCallback((value: number) => {
    const goal: StoredMonthlyGoal = { value, month: getMonthKey() };
    writeStore(KEYS.MONTHLY_GOAL, goal);
    setMonthlyGoalState(value);
  }, []);

  const setAnnualGoal = useCallback((value: number) => {
    const goal: StoredAnnualGoal = { value, year: getYear() };
    writeStore(KEYS.ANNUAL_GOAL, goal);
    setAnnualGoalState(value);
  }, []);

  const clearMonthlyGoal = useCallback(() => {
    deleteStore(KEYS.MONTHLY_GOAL);
    deleteStore(KEYS.MONTHLY_SNAPSHOT);
    setMonthlyGoalState(null);
  }, []);

  const clearAnnualGoal = useCallback(() => {
    deleteStore(KEYS.ANNUAL_GOAL);
    deleteStore(KEYS.ANNUAL_SNAPSHOT);
    setAnnualGoalState(null);
  }, []);

  return {
    monthlyGoal,
    annualGoal,
    prevMonthSummary,
    prevYearSummary,
    setMonthlyGoal,
    setAnnualGoal,
    clearMonthlyGoal,
    clearAnnualGoal,
  };
}
