import { useMemo } from "react";
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
import { useStats } from "@/services/hooks/useStats";
import type { Tournament } from "@/services/hooks/types";
import { getTournamentLucroUsd } from "@/utils/tournamentLucro";
import { toUsd } from "@/utils/currencyConvert";

function toNum(v: unknown): number {
  if (typeof v === "string" && v.toLowerCase() === "ticket") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statRowLabel}>{label}</Text>
      <Text style={[styles.statRowValue, { color: color ?? "#f5f5f5" }]}>
        {value}
      </Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function StatsScreen() {
  const { getStatsSummary, getAllTournamentsForStats } = useStats();
  const { data: summary, isLoading: loadingSummary } = getStatsSummary;
  const { data: tournamentsData, isLoading: loadingTournaments, refetch } = getAllTournamentsForStats;

  const tournaments: Tournament[] = (tournamentsData as { data?: Tournament[] })?.data ?? [];

  const stats = useMemo(() => {
    if (!tournaments.length) return null;

    const totalBuyIn = tournaments.reduce((acc, t) => acc + toUsd(toNum(t.buyIn), t.currency, 1), 0);
    const totalWinnings = tournaments.reduce((acc, t) => acc + getTournamentLucroUsd(t, 1), 0);
    const totalTournaments = tournaments.length;
    const itmCount = tournaments.filter((t) => t.itm).length;
    const ftCount = tournaments.filter((t) => t.hasFt).length;
    const itmPct = totalTournaments > 0 ? (itmCount / totalTournaments) * 100 : 0;
    const ftPct = totalTournaments > 0 ? (ftCount / totalTournaments) * 100 : 0;
    const abi = totalTournaments > 0 ? totalBuyIn / totalTournaments : 0;
    const roi = totalBuyIn > 0 ? (totalWinnings / totalBuyIn) * 100 : 0;

    const byPlatform = tournaments.reduce<Record<string, { count: number; profit: number }>>((acc, t) => {
      if (!acc[t.platform]) acc[t.platform] = { count: 0, profit: 0 };
      acc[t.platform]!.count += 1;
      acc[t.platform]!.profit += getTournamentLucroUsd(t, 1);
      return acc;
    }, {});

    const byCurrency = tournaments.reduce<Record<string, number>>((acc, t) => {
      acc[t.currency] = (acc[t.currency] ?? 0) + 1;
      return acc;
    }, {});

    return { totalBuyIn, totalWinnings, totalTournaments, itmCount, ftCount, itmPct, ftPct, abi, roi, byPlatform, byCurrency };
  }, [tournaments]);

  const isLoading = loadingSummary || loadingTournaments;

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
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerEyebrow}>Análise</Text>
              <Text style={styles.headerTitle}>Stats</Text>
            </View>
            <TouchableOpacity
              style={styles.monthlyLink}
              onPress={() => router.push("/monthly")}
            >
              <Text style={styles.monthlyLinkText}>Mensal</Text>
              <Ionicons name="chevron-forward" size={14} color="#d4a843" />
            </TouchableOpacity>
          </View>
        </View>

        {stats ? (
          <>
            <SectionCard title="Geral">
              <StatRow label="Torneios jogados" value={String(stats.totalTournaments)} />
              <StatRow label="Total buy-in" value={`$${stats.totalBuyIn.toFixed(2)}`} />
              <StatRow label="ABI" value={`$${stats.abi.toFixed(2)}`} />
              <StatRow
                label="Lucro total"
                value={`${stats.totalWinnings >= 0 ? "+" : ""}$${stats.totalWinnings.toFixed(2)}`}
                color={stats.totalWinnings >= 0 ? "#22c55e" : "#ef4444"}
              />
              <StatRow
                label="ROI"
                value={`${stats.roi >= 0 ? "+" : ""}${stats.roi.toFixed(1)}%`}
                color={stats.roi >= 0 ? "#22c55e" : "#ef4444"}
              />
            </SectionCard>

            <SectionCard title="Performance">
              <StatRow label="ITM" value={`${stats.itmCount} (${stats.itmPct.toFixed(1)}%)`} color="#d4a843" />
              <StatRow label="Final Tables" value={`${stats.ftCount} (${stats.ftPct.toFixed(1)}%)`} color="#3b82f6" />
              <StatRow
                label="1º lugar"
                value={`🥇 ${tournaments.filter((t) => t.position === 1).length}`}
              />
              <StatRow
                label="2º lugar"
                value={`🥈 ${tournaments.filter((t) => t.position === 2).length}`}
              />
              <StatRow
                label="3º lugar"
                value={`🥉 ${tournaments.filter((t) => t.position === 3).length}`}
              />
            </SectionCard>

            {summary && (
              <SectionCard title="Records">
                {summary.biggestBuyIn && (
                  <StatRow
                    label="Maior buy-in"
                    value={`$${summary.biggestBuyIn.value.toFixed(2)} — ${summary.biggestBuyIn.tournament.name}`}
                  />
                )}
                {summary.mostTournamentsInADay && (
                  <StatRow
                    label="Mais torneios em um dia"
                    value={`${summary.mostTournamentsInADay.count} (${new Date(summary.mostTournamentsInADay.date).toLocaleDateString("pt-BR")})`}
                  />
                )}
                {summary.highestAbiDay && (
                  <StatRow
                    label="Dia com maior ABI"
                    value={`$${summary.highestAbiDay.abi.toFixed(2)} (${summary.highestAbiDay.tournaments} torneios)`}
                  />
                )}
              </SectionCard>
            )}

            <SectionCard title="Por plataforma">
              {Object.entries(stats.byPlatform)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([platform, data]) => (
                  <StatRow
                    key={platform}
                    label={platform}
                    value={`${data.count} torneios · ${data.profit >= 0 ? "+" : ""}$${data.profit.toFixed(2)}`}
                    color={data.profit >= 0 ? "#22c55e" : "#ef4444"}
                  />
                ))}
            </SectionCard>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum dado disponível</Text>
          </View>
        )}
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
    marginTop: 24,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthlyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  monthlyLinkText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#d4a843",
  },
  headerEyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.62,
    color: "#555555",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f5f5f5",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    color: "#555555",
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.35,
    color: "#555555",
    marginBottom: 4,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  statRowLabel: {
    fontSize: 14,
    color: "#888888",
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
