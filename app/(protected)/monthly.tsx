import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTournaments } from "@/services/hooks/useTournaments";
import { useCurrency } from "@/services/hooks/useCurrency";
import { getEurToUsdRate, toUsd, convertUsdToBrl } from "@/utils/currencyConvert";
import { getTournamentLucroUsd } from "@/utils/tournamentLucro";
import type { Tournament } from "@/services/hooks/types";

const MONTH_SHORT = [
  "Jan", "Fev", "Mar", "Abr",
  "Mai", "Jun", "Jul", "Ago",
  "Set", "Out", "Nov", "Dez",
];

function toNum(v: unknown): number {
  if (typeof v === "string" && v.toLowerCase() === "ticket") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number): string {
  return n.toFixed(2);
}

function profitColor(n: number): string {
  if (n > 0) return "#22c55e";
  if (n < 0) return "#ef4444";
  return "#555555";
}

function profitSign(n: number): string {
  return n > 0 ? "+" : "";
}

interface MonthlyStats {
  month: number;
  profit: number;
  totalBuyIn: number;
  count: number;
  itmCount: number;
  itmRate: number;
  ftCount: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  abi: number;
  days: number;
}

interface MonthlyYearTotals {
  profit: number;
  count: number;
  totalBuyIn: number;
  itmRate: number;
  abi: number;
  days: number;
}

function useMonthlyStats() {
  const { getAllTournaments } = useTournaments({ limit: 9999 });
  const { data: tournamentsResponse, isLoading, refetch } = getAllTournaments;
  const { currencies } = useCurrency();
  const eurToUsdRate = getEurToUsdRate(currencies?.data?.rates);
  const brlRate: number | undefined = currencies?.data?.rates?.BRL;

  const tournaments: Tournament[] = useMemo(
    () => tournamentsResponse?.data?.data ?? [],
    [tournamentsResponse],
  );

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const t of tournaments) {
      const d = new Date(t.date);
      if (!Number.isNaN(d.getTime())) years.add(d.getFullYear());
    }
    const sorted = [...years].sort((a, b) => b - a);
    if (!sorted.length) sorted.push(new Date().getFullYear());
    return sorted;
  }, [tournaments]);

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  const months = useMemo<MonthlyStats[]>(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const filtered = tournaments.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === selectedYear && d.getMonth() === month;
      });

      const profit = filtered.reduce((acc, t) => acc + getTournamentLucroUsd(t, eurToUsdRate), 0);
      const totalBuyIn = filtered.reduce(
        (acc, t) => acc + toUsd(toNum(t.buyIn), t.currency, eurToUsdRate),
        0,
      );
      const count = filtered.length;
      const itmCount = filtered.filter((t) => t.itm).length;
      const ftCount = filtered.filter((t) => t.hasFt).length;
      const goldCount = filtered.filter((t) => t.position === 1).length;
      const silverCount = filtered.filter((t) => t.position === 2).length;
      const bronzeCount = filtered.filter((t) => t.position === 3).length;
      const days = new Set(filtered.map((t) => String(t.date).split("T")[0])).size;

      return {
        month,
        profit,
        totalBuyIn,
        count,
        itmCount,
        itmRate: count > 0 ? (itmCount / count) * 100 : 0,
        ftCount,
        goldCount,
        silverCount,
        bronzeCount,
        abi: count > 0 ? totalBuyIn / count : 0,
        days,
      };
    });
  }, [tournaments, selectedYear, eurToUsdRate]);

  const yearTotals = useMemo<MonthlyYearTotals>(() => {
    const profit = months.reduce((acc, m) => acc + m.profit, 0);
    const count = months.reduce((acc, m) => acc + m.count, 0);
    const totalBuyIn = months.reduce((acc, m) => acc + m.totalBuyIn, 0);
    const itmCount = months.reduce((acc, m) => acc + m.itmCount, 0);
    const days = months.reduce((acc, m) => acc + m.days, 0);
    return {
      profit,
      count,
      totalBuyIn,
      itmRate: count > 0 ? (itmCount / count) * 100 : 0,
      abi: count > 0 ? totalBuyIn / count : 0,
      days,
    };
  }, [months]);

  return {
    isLoading,
    selectedYear,
    availableYears,
    months,
    yearTotals,
    brlRate,
    onYearChange: setSelectedYear,
    refetch,
  };
}

function MonthCard({
  stats,
  maxAbsProfit,
  isCurrentMonth,
  brlRate,
}: {
  stats: MonthlyStats;
  maxAbsProfit: number;
  isCurrentMonth: boolean;
  brlRate: number | undefined;
}) {
  const empty = stats.count === 0;
  const barWidth = maxAbsProfit > 0 ? Math.abs(stats.profit) / maxAbsProfit : 0;
  const isProfit = stats.profit >= 0;

  return (
    <View
      style={[
        styles.monthCard,
        empty && styles.monthCardEmpty,
        isCurrentMonth && styles.monthCardCurrent,
      ]}
    >
      <View style={styles.monthCardHeader}>
        <View>
          <Text style={styles.monthCardLabel}>{MONTH_SHORT[stats.month]}</Text>
          <View style={styles.monthCardProfitRow}>
            <Text style={[styles.monthCardProfit, { color: profitColor(stats.profit) }]}>
              {empty ? "—" : `${profitSign(stats.profit)}$${fmt(stats.profit)}`}
            </Text>
            {!empty && brlRate !== undefined && (
              <Text style={[styles.monthCardProfitBrl, { color: profitColor(stats.profit) }]}>
                ({convertUsdToBrl(brlRate * stats.profit)})
              </Text>
            )}
          </View>
        </View>
        {!empty && <Text style={styles.monthCardCount}>{stats.count} torn.</Text>}
      </View>

      {!empty && (
        <View style={styles.monthCardGrid}>
          <View style={styles.monthCardGridItem}>
            <Text style={styles.monthCardGridLabel}>ITM</Text>
            <Text style={styles.monthCardGridValue}>
              {stats.itmRate.toFixed(0)}% <Text style={styles.monthCardGridMuted}>({stats.itmCount})</Text>
            </Text>
          </View>
          <View style={styles.monthCardGridItem}>
            <Text style={styles.monthCardGridLabel}>ABI</Text>
            <Text style={styles.monthCardGridValue}>${fmt(stats.abi)}</Text>
          </View>
          <View style={styles.monthCardGridItem}>
            <Text style={styles.monthCardGridLabel}>Buy-in total</Text>
            <Text style={styles.monthCardGridValue}>${fmt(stats.totalBuyIn)}</Text>
          </View>
          <View style={styles.monthCardGridItem}>
            <Text style={styles.monthCardGridLabel}>Dias</Text>
            <Text style={styles.monthCardGridValue}>{stats.days}</Text>
          </View>
          <View style={styles.monthCardGridItem}>
            <Text style={styles.monthCardGridLabel}>FT</Text>
            <Text style={styles.monthCardGridValue}>{stats.ftCount}</Text>
          </View>
          <View style={styles.monthCardGridItem}>
            <Text style={styles.monthCardGridLabel}>Pódio</Text>
            <Text style={styles.monthCardGridValue}>
              {stats.goldCount > 0 && `🥇${stats.goldCount} `}
              {stats.silverCount > 0 && `🥈${stats.silverCount} `}
              {stats.bronzeCount > 0 && `🥉${stats.bronzeCount}`}
              {stats.goldCount === 0 && stats.silverCount === 0 && stats.bronzeCount === 0 && (
                <Text style={styles.monthCardGridMuted}>—</Text>
              )}
            </Text>
          </View>
        </View>
      )}

      {!empty && (
        <View style={styles.profitBarTrack}>
          <View
            style={[
              styles.profitBarFill,
              {
                width: `${(barWidth * 100).toFixed(1)}%` as `${number}%`,
                backgroundColor: isProfit ? "#22c55e" : "#ef4444",
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

export default function MonthlyScreen() {
  const {
    isLoading,
    selectedYear,
    availableYears,
    months,
    yearTotals,
    brlRate,
    onYearChange,
    refetch,
  } = useMonthlyStats();

  const now = new Date();
  const currentCalYear = now.getFullYear();
  const currentCalMonth = now.getMonth();

  const maxAbsProfit = Math.max(...months.map((m) => Math.abs(m.profit)), 0);

  const canGoPrev = availableYears.indexOf(selectedYear) < availableYears.length - 1;
  const canGoNext = availableYears.indexOf(selectedYear) > 0;

  const goPrev = () => {
    const idx = availableYears.indexOf(selectedYear);
    if (idx < availableYears.length - 1) onYearChange(availableYears[idx + 1]!);
  };

  const goNext = () => {
    const idx = availableYears.indexOf(selectedYear);
    if (idx > 0) onYearChange(availableYears[idx - 1]!);
  };

  const summaryItems = [
    { label: "Profit anual", value: `${profitSign(yearTotals.profit)}$${fmt(yearTotals.profit)}`, color: profitColor(yearTotals.profit), large: true },
    { label: "Torneios", value: String(yearTotals.count), color: "#f5f5f5" },
    { label: "ITM", value: `${yearTotals.itmRate.toFixed(1)}%`, color: "#f5f5f5" },
    { label: "ABI médio", value: `$${fmt(yearTotals.abi)}`, color: "#f5f5f5" },
    { label: "Buy-in total", value: `$${fmt(yearTotals.totalBuyIn)}`, color: "#f5f5f5" },
    { label: "Dias jogados", value: String(yearTotals.days), color: "#f5f5f5" },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color="#d4a843" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor="#d4a843" />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={16} color="#d4a843" />
            <Text style={styles.backButtonText}>Stats</Text>
          </TouchableOpacity>

          <Text style={styles.headerEyebrow}>Histórico</Text>

          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Performance mensal</Text>

            <View style={styles.yearNav}>
              <TouchableOpacity
                onPress={goPrev}
                disabled={!canGoPrev}
                style={[styles.yearNavButton, !canGoPrev && styles.yearNavButtonDisabled]}
              >
                <Ionicons name="chevron-back" size={13} color="#d4a843" />
              </TouchableOpacity>
              <Text style={styles.yearText}>{selectedYear}</Text>
              <TouchableOpacity
                onPress={goNext}
                disabled={!canGoNext}
                style={[styles.yearNavButton, !canGoNext && styles.yearNavButtonDisabled]}
              >
                <Ionicons name="chevron-forward" size={13} color="#d4a843" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            {summaryItems.map((item) => (
              <View key={item.label} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={[styles.summaryValue, item.large && styles.summaryValueLarge, { color: item.color }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.monthGrid}>
          {months.map((m) => (
            <MonthCard
              key={m.month}
              stats={m}
              maxAbsProfit={maxAbsProfit}
              brlRate={brlRate}
              isCurrentMonth={selectedYear === currentCalYear && m.month === currentCalMonth}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backButtonText: {
    color: "#d4a843",
    fontSize: 13,
    fontWeight: "500",
  },
  headerEyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.62,
    color: "#555555",
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f5f5f5",
    flexShrink: 1,
  },
  yearNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  yearNavButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 4,
  },
  yearNavButtonDisabled: {
    opacity: 0.25,
  },
  yearText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d4a843",
    width: 52,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  summaryItem: {
    minWidth: "28%",
  },
  summaryLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#555555",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryValueLarge: {
    fontSize: 18,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 16,
  },
  monthCard: {
    width: "48%",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  monthCardEmpty: {
    opacity: 0.38,
  },
  monthCardCurrent: {
    borderColor: "#d4a843",
  },
  monthCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  monthCardLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#555555",
    marginBottom: 2,
  },
  monthCardProfitRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 4,
  },
  monthCardProfit: {
    fontSize: 16,
    fontWeight: "600",
  },
  monthCardProfitBrl: {
    fontSize: 9,
    opacity: 0.7,
  },
  monthCardCount: {
    fontSize: 9,
    color: "#555555",
  },
  monthCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monthCardGridItem: {
    width: "45%",
  },
  monthCardGridLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#555555",
    marginBottom: 2,
  },
  monthCardGridValue: {
    fontSize: 11,
    color: "#f5f5f5",
  },
  monthCardGridMuted: {
    color: "#555555",
  },
  profitBarTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#1a1a1a",
    overflow: "hidden",
  },
  profitBarFill: {
    height: "100%",
    borderRadius: 2,
  },
});
