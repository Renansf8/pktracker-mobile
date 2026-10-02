import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetUser } from "@/services/hooks/useGetUser";
import { useBank } from "@/services/hooks/useBank";

type TransactionType = "deposit" | "withdrawal" | "rake";

export default function BankScreen() {
  const { data: user, isLoading, refetch } = useGetUser();
  const { createDeposit, createWithdrawal, createRake } = useBank();
  const [activeTab, setActiveTab] = useState<TransactionType>("deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0] ?? "");
  const [refreshing, setRefreshing] = useState(false);

  const bank = user?.bank;

  const isSubmitting =
    createDeposit.isPending || createWithdrawal.isPending || createRake.isPending;

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    const payload = { amount: numAmount, date };
    if (activeTab === "deposit") createDeposit.mutate(payload, { onSuccess: () => setAmount("") });
    else if (activeTab === "withdrawal") createWithdrawal.mutate(payload, { onSuccess: () => setAmount("") });
    else createRake.mutate(payload, { onSuccess: () => setAmount("") });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color="#d4a843" />
      </SafeAreaView>
    );
  }

  const tabs: { key: TransactionType; label: string; color: string }[] = [
    { key: "deposit", label: "Depósito", color: "#d4a843" },
    { key: "withdrawal", label: "Saque", color: "#f59e0b" },
    { key: "rake", label: "Rake", color: "#888888" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4a843" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Gestão</Text>
          <Text style={styles.headerTitle}>Banca</Text>
        </View>

        {/* Resumo da banca */}
        {bank && (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>Visão geral</Text>
            <View style={styles.summaryRows}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Banca total</Text>
                <Text style={[styles.summaryValue, { color: "#d4a843" }]}>
                  ${bank.bank.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Depósitos</Text>
                <Text style={[styles.summaryValue, { color: "#3b82f6" }]}>
                  ${bank.totalDeposit.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Saques</Text>
                <Text style={[styles.summaryValue, { color: "#f59e0b" }]}>
                  ${bank.totalWithdrawal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rake recebido</Text>
                <Text style={[styles.summaryValue, { color: "#888888" }]}>
                  ${bank.totalRake.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRowDivider}>
                <Text style={styles.summaryLabel}>Lucro líquido</Text>
                <Text style={[styles.summaryValue, { color: bank.profit >= 0 ? "#22c55e" : "#ef4444" }]}>
                  {bank.profit >= 0 ? "+" : ""}${bank.profit.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Formulário de transação */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Nova transação</Text>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  activeTab === tab.key
                    ? { backgroundColor: `${tab.color}20`, borderColor: tab.color }
                    : styles.tabInactive,
                ]}
              >
                <Text style={[styles.tabText, { color: activeTab === tab.key ? tab.color : "#555555" }]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Data</Text>
          <TextInput
            style={styles.input}
            placeholder="2024-01-15"
            placeholderTextColor="#555555"
            value={date}
            onChangeText={setDate}
          />

          <Text style={styles.inputLabel}>Valor (USD)</Text>
          <TextInput
            style={[styles.input, { marginBottom: 16 }]}
            placeholder="100.00"
            placeholderTextColor="#555555"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting || !amount}
            style={({ pressed }) => [
              styles.submitButton,
              { opacity: isSubmitting || !amount ? 0.5 : pressed ? 0.8 : 1 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text style={styles.submitButtonText}>
                Registrar {tabs.find((t) => t.key === activeTab)?.label}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Histórico */}
        {bank?.deposits && bank.deposits.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>Últimos depósitos</Text>
            {bank.deposits.slice(-5).reverse().map((d) => (
              <View key={d.id} style={styles.depositRow}>
                <Text style={styles.depositDate}>
                  {new Date(d.date).toLocaleDateString("pt-BR")}
                </Text>
                <Text style={styles.depositAmount}>+${d.amount.toFixed(2)}</Text>
              </View>
            ))}
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
  card: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardEyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.35,
    color: "#555555",
    marginBottom: 12,
  },
  summaryRows: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryRowDivider: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    paddingTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#888888",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  tabInactive: {
    backgroundColor: "#1a1a1a",
    borderColor: "#2a2a2a",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.44,
    color: "#888888",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#f5f5f5",
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "#d4a843",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#0a0a0a",
    fontWeight: "600",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  depositRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  depositDate: {
    fontSize: 12,
    color: "#888888",
  },
  depositAmount: {
    fontSize: 14,
    color: "#3b82f6",
  },
});
