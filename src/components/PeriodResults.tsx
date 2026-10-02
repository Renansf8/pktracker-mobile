import { useMemo, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { G, Line, Rect, Svg, Text as SvgText } from "react-native-svg";
import type { Tournament } from "@/services/hooks/types";
import { getEurToUsdRate, toUsd } from "@/utils/currencyConvert";
import { getTournamentLucroUsd } from "@/utils/tournamentLucro";

const MONTH_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

type Period = "dia" | "semana" | "mes" | "ano";

interface ChartBar { label: string; value: number }

function toNum(v: unknown): number {
  if (typeof v === "string" && v.toLowerCase() === "ticket") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseDateLocal(raw: string | Date): Date {
  if (raw instanceof Date) return raw;
  const str = String(raw);
  const datePart = str.includes("T") ? str.split("T")[0]! : str.split(" ")[0]!;
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function buildStats(list: Tournament[], rate: number) {
  const totalTournaments = list.length;
  const totalBuyIn = list.reduce((acc, t) => acc + toUsd(toNum(t.buyIn), t.currency, rate), 0);
  const totalWinnings = list.reduce((acc, t) => acc + getTournamentLucroUsd(t, rate), 0);
  const itmCount = list.filter((t) => t.itm).length;
  const itmPct = totalTournaments > 0 ? (itmCount / totalTournaments) * 100 : 0;
  const ftCount = list.filter((t) => t.hasFt).length;
  const abi = totalTournaments > 0 ? totalBuyIn / totalTournaments : 0;
  return { totalTournaments, totalBuyIn, totalWinnings, itmCount, itmPct, ftCount, abi };
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

const CHART_H = 110;
const LABEL_H = 20;
const GAP = 5;

function BarChart({ data, barWidth }: { data: ChartBar[]; barWidth: number }) {
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const maxPos = Math.max(0, ...values);
  const maxNeg = Math.abs(Math.min(0, ...values));
  const total = maxPos + maxNeg;

  const positiveH = total > 0 ? (maxPos / total) * CHART_H : CHART_H / 2;
  const negativeH = CHART_H - positiveH;
  const zeroY = positiveH;

  const svgW = data.length * (barWidth + GAP) - GAP;
  const svgH = CHART_H + LABEL_H;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={svgW} height={svgH}>
        {/* Zero line */}
        <Line x1={0} y1={zeroY} x2={svgW} y2={zeroY} stroke="#2a2a2a" strokeWidth={1} />

        {data.map((d, i) => {
          const x = i * (barWidth + GAP);
          let barH: number, barY: number, color: string;

          if (d.value > 0 && maxPos > 0) {
            barH = Math.max((d.value / maxPos) * positiveH, 2);
            barY = zeroY - barH;
            color = "#22c55e";
          } else if (d.value < 0 && maxNeg > 0) {
            barH = Math.max((Math.abs(d.value) / maxNeg) * negativeH, 2);
            barY = zeroY;
            color = "#ef4444";
          } else {
            barH = 1;
            barY = zeroY;
            color = "#2a2a2a";
          }

          return (
            <G key={i}>
              <Rect x={x} y={barY} width={barWidth} height={barH} rx={2} fill={color} opacity={0.85} />
              <SvgText
                x={x + barWidth / 2}
                y={svgH - 3}
                fontSize={8}
                fill="#555555"
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────

function StatBox({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statBoxLabel}>{label}</Text>
      <Text style={[styles.statBoxValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PeriodResults({ tournaments }: { tournaments: Tournament[] }) {
  const [period, setPeriod] = useState<Period>("dia");

  const eurToUsdRate = getEurToUsdRate(undefined);
  const screenW = Dimensions.get("window").width;

  const today = new Date();
  const curYear = today.getFullYear();
  const curMonth = today.getMonth();
  const curDay = today.getDate();

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const todayStr = `${String(curDay).padStart(2, "0")}/${String(curMonth + 1).padStart(2, "0")}/${curYear}`;
  const weekLabel = `${String(weekStart.getDate()).padStart(2, "0")}/${String(weekStart.getMonth() + 1).padStart(2, "0")} – ${String(weekEnd.getDate()).padStart(2, "0")}/${String(weekEnd.getMonth() + 1).padStart(2, "0")}`;

  const periodLabel: Record<Period, string> = {
    dia: todayStr,
    semana: weekLabel,
    mes: MONTH_PT[curMonth]!,
    ano: String(curYear),
  };

  // ── Filtered lists ────────────────────────────────────────────────────────

  const dayList = useMemo(
    () => tournaments.filter((t) => {
      const d = parseDateLocal(t.date);
      return d.getFullYear() === curYear && d.getMonth() === curMonth && d.getDate() === curDay;
    }),
    [tournaments, curYear, curMonth, curDay],
  );

  const weekList = useMemo(
    () => tournaments.filter((t) => { const d = parseDateLocal(t.date); return d >= weekStart && d <= weekEnd; }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tournaments, weekStart.getTime()],
  );

  const monthList = useMemo(
    () => tournaments.filter((t) => { const d = parseDateLocal(t.date); return d.getFullYear() === curYear && d.getMonth() === curMonth; }),
    [tournaments, curYear, curMonth],
  );

  const yearList = useMemo(
    () => tournaments.filter((t) => parseDateLocal(t.date).getFullYear() === curYear),
    [tournaments, curYear],
  );

  const listMap: Record<Period, Tournament[]> = { dia: dayList, semana: weekList, mes: monthList, ano: yearList };
  const stats = useMemo(() => buildStats(listMap[period], eurToUsdRate), [listMap, period, eurToUsdRate]);

  // ── Chart data ────────────────────────────────────────────────────────────

  const chartData = useMemo<ChartBar[]>(() => {
    switch (period) {
      case "dia":
        return dayList.map((t) => ({
          label: t.name.length > 8 ? `${t.name.slice(0, 7)}…` : t.name,
          value: getTournamentLucroUsd(t, eurToUsdRate),
        }));

      case "semana":
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + i);
          const profit = weekList
            .filter((t) => {
              const td = parseDateLocal(t.date);
              return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && td.getDate() === d.getDate();
            })
            .reduce((acc, t) => acc + getTournamentLucroUsd(t, eurToUsdRate), 0);
          return { label: DAY_PT[i]!, value: profit };
        });

      case "mes": {
        const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const profit = monthList
            .filter((t) => parseDateLocal(t.date).getDate() === day)
            .reduce((acc, t) => acc + getTournamentLucroUsd(t, eurToUsdRate), 0);
          return { label: String(day), value: profit };
        });
      }

      case "ano":
        return MONTH_PT.map((name, idx) => ({
          label: name.slice(0, 3),
          value: yearList
            .filter((t) => parseDateLocal(t.date).getMonth() === idx)
            .reduce((acc, t) => acc + getTournamentLucroUsd(t, eurToUsdRate), 0),
        }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dayList, weekList, monthList, yearList, eurToUsdRate]);

  // ── Bar width (responsive) ────────────────────────────────────────────────
  const cardPadding = 32; // 16 * 2
  const availableW = screenW - cardPadding - 2; // 2 for border
  const barWidth = useMemo(() => {
    const n = chartData.length;
    if (n === 0) return 24;
    const maxFit = Math.floor((availableW + GAP) / (n + GAP / n));
    return Math.min(Math.max(maxFit, 14), 40);
  }, [chartData.length, availableW]);

  const profitColor = stats.totalWinnings > 0 ? "#22c55e" : stats.totalWinnings < 0 ? "#ef4444" : "#888888";

  const tabs: { key: Period; label: string }[] = [
    { key: "dia", label: "Dia" },
    { key: "semana", label: "Semana" },
    { key: "mes", label: "Mês" },
    { key: "ano", label: "Ano" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resultados</Text>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setPeriod(tab.key)}
            style={[styles.tab, period === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, period === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Period label */}
      <Text style={styles.periodLabel}>{periodLabel[period]}</Text>

      {/* Stats grid */}
      <View style={styles.grid}>
        <StatBox label="Torneios" value={String(stats.totalTournaments)} />
        <StatBox
          label="Lucro"
          value={`${stats.totalWinnings >= 0 ? "+" : ""}$${stats.totalWinnings.toFixed(2)}`}
          valueColor={profitColor}
        />
        <StatBox label="Buy-in total" value={`$${stats.totalBuyIn.toFixed(2)}`} />
        <StatBox label="ABI" value={`$${stats.abi.toFixed(2)}`} />
        <StatBox label="ITM" value={`${stats.itmCount} (${stats.itmPct.toFixed(1)}%)`} />
        <StatBox label="Final Tables" value={String(stats.ftCount)} />
      </View>

      {/* Chart */}
      {chartData.length > 0 && (
        <View style={styles.chartContainer}>
          <BarChart data={chartData} barWidth={barWidth} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f5f5f5",
    marginBottom: 12,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  tabText: {
    fontSize: 12,
    color: "#555555",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#d4a843",
    fontWeight: "600",
  },
  periodLabel: {
    fontSize: 13,
    color: "#888888",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    width: "47.5%",
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#1e1e1e",
    borderRadius: 8,
    padding: 12,
  },
  statBoxLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.35,
    color: "#555555",
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f5f5f5",
  },
  chartContainer: {
    marginTop: 4,
  },
});
