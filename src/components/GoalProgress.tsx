import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGoals, type PrevMonthSummary, type PrevYearSummary } from "@/utils/useGoals";

const MONTH_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function moneyAbs(n: number): string {
  return `$ ${Math.abs(n).toFixed(2)}`;
}

function formatGoalMonth(monthKey: string): string {
  const [year, mon] = monthKey.split("-");
  const idx = parseInt(mon ?? "1") - 1;
  return `${MONTH_PT[idx] ?? mon} ${year}`;
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const barColor =
    pct >= 100 ? "#22c55e" : pct >= 50 ? "#f59e0b" : pct > 0 ? "#ef4444" : "#2a2a2a";

  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clamped}%` as `${number}%`, backgroundColor: barColor }]} />
    </View>
  );
}

function GoalInput({ onSet, placeholder }: { onSet: (v: number) => void; placeholder: string }) {
  const [value, setValue] = useState("");

  function handleSet() {
    const n = parseFloat(value.replace(",", "."));
    if (Number.isFinite(n) && n > 0) {
      onSet(n);
      setValue("");
    }
  }

  return (
    <View style={styles.goalInputContainer}>
      <Text style={styles.goalInputLabel}>Definir meta em USD</Text>
      <View style={styles.goalInputRow}>
        <Text style={styles.goalInputPrefix}>$</Text>
        <TextInput
          style={styles.goalInput}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor="#555555"
          value={value}
          onChangeText={setValue}
          onSubmitEditing={handleSet}
        />
        <TouchableOpacity
          style={[styles.goalSetBtn, (!value || parseFloat(value) <= 0) && styles.goalSetBtnDisabled]}
          onPress={handleSet}
          disabled={!value || parseFloat(value) <= 0}
        >
          <Text style={styles.goalSetBtnText}>Definir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PrevSummaryBadge({ label, summary }: { label: string; summary: PrevMonthSummary | PrevYearSummary }) {
  const color = summary.met ? "#22c55e" : "#ef4444";
  return (
    <View style={styles.prevBadge}>
      <Text style={styles.prevBadgeLabel}>{label}</Text>
      <Text style={[styles.prevBadgeValue, { color }]}>
        {summary.met ? "✓" : "✗"} {moneyAbs(summary.achieved)}
      </Text>
      <Text style={styles.prevBadgeMeta}>meta: $ {summary.goal.toFixed(2)}</Text>
    </View>
  );
}

function GoalCard({
  badge,
  title,
  goal,
  currentProfit,
  inputPlaceholder,
  onSetGoal,
  onClearGoal,
  prevSummary,
}: {
  badge: string;
  title: string;
  goal: number | null;
  currentProfit: number;
  inputPlaceholder: string;
  onSetGoal: (v: number) => void;
  onClearGoal: () => void;
  prevSummary: PrevMonthSummary | PrevYearSummary | null;
}) {
  const pct = goal !== null && goal > 0 ? (currentProfit / goal) * 100 : 0;
  const profitColor = currentProfit > 0 ? "#22c55e" : currentProfit < 0 ? "#ef4444" : "#888888";

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalCardHeader}>
        <View>
          <Text style={styles.goalCardBadge}>{badge}</Text>
          <Text style={styles.goalCardTitle}>{title}</Text>
        </View>
        {goal !== null && (
          <TouchableOpacity onPress={onClearGoal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil-outline" size={14} color="#555555" />
          </TouchableOpacity>
        )}
      </View>

      {goal === null ? (
        <GoalInput onSet={onSetGoal} placeholder={inputPlaceholder} />
      ) : (
        <View style={styles.goalCardBody}>
          <View style={styles.goalPctRow}>
            <Text style={[styles.goalPct, { color: pct >= 100 ? "#22c55e" : pct >= 50 ? "#f59e0b" : pct > 0 ? "#ef4444" : "#555555" }]}>
              {pct <= 0 ? "0%" : `${Math.round(pct)}%`}
            </Text>
          </View>
          <ProgressBar pct={pct} />
          <Text style={styles.goalProfitText}>
            <Text style={{ color: profitColor }}>{currentProfit < 0 ? "- " : ""}$ {Math.abs(currentProfit).toFixed(2)}</Text>
            <Text style={{ color: "#555555" }}> / </Text>
            <Text style={{ color: "#f59e0b" }}>$ {goal.toFixed(2)}</Text>
          </Text>
        </View>
      )}

      {prevSummary && (
        <View style={styles.prevBadgeWrapper}>
          <PrevSummaryBadge
            label={"month" in prevSummary ? formatGoalMonth((prevSummary as PrevMonthSummary).month) : String((prevSummary as PrevYearSummary).year)}
            summary={prevSummary}
          />
        </View>
      )}
    </View>
  );
}

export function GoalProgress({
  monthlyProfitUsd,
  yearlyProfitUsd,
}: {
  monthlyProfitUsd: number;
  yearlyProfitUsd: number;
}) {
  const {
    monthlyGoal,
    annualGoal,
    prevMonthSummary,
    prevYearSummary,
    setMonthlyGoal,
    setAnnualGoal,
    clearMonthlyGoal,
    clearAnnualGoal,
  } = useGoals(monthlyProfitUsd, yearlyProfitUsd);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Metas</Text>
      <View style={styles.cardsContainer}>
        <GoalCard
          badge="◆ MENSAL"
          title="Meta do mês"
          goal={monthlyGoal}
          currentProfit={monthlyProfitUsd}
          inputPlaceholder="1000"
          onSetGoal={setMonthlyGoal}
          onClearGoal={clearMonthlyGoal}
          prevSummary={prevMonthSummary}
        />
        <GoalCard
          badge="◆ ANUAL"
          title="Meta do ano"
          goal={annualGoal}
          currentProfit={yearlyProfitUsd}
          inputPlaceholder="12000"
          onSetGoal={setAnnualGoal}
          onClearGoal={clearAnnualGoal}
          prevSummary={prevYearSummary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f5f5f5",
    marginBottom: 12,
  },
  cardsContainer: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
  },
  goalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  goalCardBadge: {
    fontSize: 9,
    color: "#f59e0b",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  goalCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f5f5f5",
  },
  goalCardBody: {
    gap: 8,
  },
  goalPctRow: {
    alignItems: "center",
  },
  goalPct: {
    fontSize: 28,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  goalProfitText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  goalInputContainer: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  goalInputLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#555555",
  },
  goalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalInputPrefix: {
    fontSize: 14,
    color: "#555555",
  },
  goalInput: {
    height: 36,
    width: 100,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 6,
    paddingHorizontal: 10,
    color: "#f5f5f5",
    fontSize: 14,
    textAlign: "right",
  },
  goalSetBtn: {
    height: 36,
    paddingHorizontal: 14,
    backgroundColor: "rgba(245,158,11,0.15)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  goalSetBtnDisabled: {
    opacity: 0.4,
  },
  goalSetBtnText: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "500",
  },
  prevBadgeWrapper: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  prevBadge: {
    alignItems: "flex-end",
    gap: 2,
  },
  prevBadgeLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#555555",
  },
  prevBadgeValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  prevBadgeMeta: {
    fontSize: 9,
    color: "#555555",
  },
});
