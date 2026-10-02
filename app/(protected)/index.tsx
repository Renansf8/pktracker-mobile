import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetUser } from "@/services/hooks/useGetUser";
import { useTournaments } from "@/services/hooks/useTournaments";
import type { Tournament } from "@/services/hooks/types";
import { convertUsdToBrl, getEurToUsdRate, toUsd } from "@/utils/currencyConvert";
import { getTournamentLucroUsd } from "@/utils/tournamentLucro";
import { GoalProgress } from "@/components/GoalProgress";
import { PeriodResults } from "@/components/PeriodResults";

function toNum(v: unknown): number {
  if (typeof v === "string" && v.toLowerCase() === "ticket") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function StatCard({
  label,
  value,
  highlight,
  small,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statCardLabel}>{label}</Text>
      <Text
        style={[
          styles.statCardValue,
          small ? styles.statCardValueSmall : styles.statCardValueLarge,
          { color: highlight ? "#22c55e" : "#f5f5f5" },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { data: user, isLoading, refetch } = useGetUser();
  const { getAllTournaments } = useTournaments({ limit: 9999 });
  const { data: tournamentsResponse, refetch: refetchTournaments } = getAllTournaments;
  const [refreshing, setRefreshing] = useState(false);

  const tournaments: Tournament[] = useMemo(
    () => (tournamentsResponse?.data as { data?: Tournament[] })?.data ?? [],
    [tournamentsResponse],
  );

  const eurToUsdRate = getEurToUsdRate(undefined);
  const bankUsd = user?.bank?.bank ?? 0;

  const [thisYear] = useState(() => new Date().getFullYear());
  const [thisMonth] = useState(() => new Date().getMonth());

  const stats = useMemo(() => {
    const totalBuyIn = tournaments.reduce(
      (acc, t) => acc + toUsd(toNum(t.buyIn), t.currency, eurToUsdRate),
      0,
    );
    const totalProfit = tournaments.reduce(
      (acc, t) => acc + toUsd(toNum(t.result), t.currency, eurToUsdRate),
      0,
    );
    const totalTournaments = tournaments.length;
    const itmCount = tournaments.filter((t) => t.itm).length;
    const ftCount = tournaments.filter((t) => t.hasFt).length;
    const goldCount = tournaments.filter((t) => t.position === 1).length;
    const silverCount = tournaments.filter((t) => t.position === 2).length;
    const bronzeCount = tournaments.filter((t) => t.position === 3).length;
    const itmPercentage =
      totalTournaments > 0 ? (itmCount / totalTournaments) * 100 : 0;
    const abi = totalTournaments > 0 ? totalBuyIn / totalTournaments : 0;
    return { totalBuyIn, totalProfit, totalTournaments, itmCount, ftCount, goldCount, silverCount, bronzeCount, itmPercentage, abi };
  }, [tournaments, eurToUsdRate]);

  const monthlyProfitUsd = useMemo(() =>
    tournaments
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
      })
      .reduce((acc, t) => acc + getTournamentLucroUsd(t, eurToUsdRate), 0),
    [tournaments, eurToUsdRate, thisYear, thisMonth],
  );

  const yearlyProfitUsd = useMemo(() =>
    tournaments
      .filter((t) => new Date(t.date).getFullYear() === thisYear)
      .reduce((acc, t) => acc + getTournamentLucroUsd(t, eurToUsdRate), 0),
    [tournaments, eurToUsdRate, thisYear],
  );

  const bankDisplayText = `$ ${bankUsd.toFixed(2)}`;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    : null;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchTournaments()]);
    setRefreshing(false);
  };

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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#d4a843"
          />
        }
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.eyebrow}>Bem-vindo de volta</Text>
            <Text style={styles.userName}>{user?.name ?? ""}</Text>
            {memberSince && (
              <Text style={styles.memberSince}>membro desde {memberSince}</Text>
            )}
          </View>
          <View style={styles.bankSection}>
            <Text style={styles.eyebrow}>Banca atual</Text>
            <Text style={styles.bankValue}>{bankDisplayText}</Text>
            {user?.bank?.bank !== undefined && (
              <Text style={styles.bankBrl}>
                {convertUsdToBrl((user?.bank?.bank ?? 0) * 5.2)}
              </Text>
            )}
          </View>
        </View>

        {/* Resumo Geral */}
        <Text style={styles.sectionEyebrow}>Resumo geral</Text>

        <View style={styles.statRow}>
          <StatCard label="Torneios" value={String(stats.totalTournaments)} />
          <StatCard
            label="ITM"
            value={`${stats.itmPercentage.toFixed(1)}%`}
            highlight={stats.itmPercentage > 15}
          />
          <StatCard label="FT" value={String(stats.ftCount)} />
        </View>

        <View style={styles.statRow}>
          <StatCard label="ABI" value={`$${stats.abi.toFixed(2)}`} small />
          <StatCard label="Total Buy-in" value={`$${stats.totalBuyIn.toFixed(0)}`} small />
        </View>

        <View style={[styles.statRow, { marginBottom: 32 }]}>
          <StatCard
            label="Resultado"
            value={`$${stats.totalProfit.toFixed(2)}`}
            highlight={stats.totalProfit >= 0}
            small
          />
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>Pódios</Text>
            <View style={styles.podiumRow}>
              <Text style={styles.podiumItem}>🥇 {stats.goldCount}</Text>
              <Text style={styles.podiumItem}>🥈 {stats.silverCount}</Text>
              <Text style={styles.podiumItem}>🥉 {stats.bronzeCount}</Text>
            </View>
          </View>
        </View>

        {/* Resultado do mês */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Resultado do mês</Text>
          <Text style={[styles.monthlyProfit, { color: monthlyProfitUsd >= 0 ? "#22c55e" : "#ef4444" }]}>
            {monthlyProfitUsd >= 0 ? "+" : ""}${monthlyProfitUsd.toFixed(2)}
          </Text>
          <Text style={styles.monthLabel}>
            {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </Text>
        </View>

        {/* Metas */}
        <GoalProgress
          monthlyProfitUsd={monthlyProfitUsd}
          yearlyProfitUsd={yearlyProfitUsd}
        />

        {/* Resultados por período */}
        <PeriodResults tournaments={tournaments} />
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
  pageHeader: {
    marginTop: 24,
    marginBottom: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  eyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.62,
    color: "#555555",
    marginBottom: 6,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f5f5f5",
  },
  memberSince: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.35,
    color: "#555555",
    marginTop: 4,
  },
  bankSection: {
    alignItems: "flex-end",
  },
  bankValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#d4a843",
  },
  bankBrl: {
    fontSize: 12,
    color: "#555555",
    marginTop: 2,
  },
  sectionEyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.62,
    color: "#555555",
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  statCardLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.35,
    color: "#555555",
    marginBottom: 6,
  },
  statCardValue: {
    fontWeight: "600",
  },
  statCardValueLarge: {
    fontSize: 18,
  },
  statCardValueSmall: {
    fontSize: 16,
  },
  podiumRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  podiumItem: {
    fontSize: 13,
    color: "#f5f5f5",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardEyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.35,
    color: "#555555",
    marginBottom: 12,
  },
  monthlyProfit: {
    fontSize: 24,
    fontWeight: "bold",
  },
  monthLabel: {
    fontSize: 12,
    color: "#555555",
    marginTop: 4,
  },
});
