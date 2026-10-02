import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useGetUser } from "@/services/hooks/useGetUser";
import { authStorage } from "@/lib/auth/storage";
import { apiClient } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import Toast from "react-native-toast-message";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, refetch } = useGetUser();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");

  const handleSignOut = () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
            } catch {
              // ignora erro de logout no servidor
            } finally {
              await authStorage.clearToken();
              queryClient.clear();
              router.replace("/(auth)/signin");
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await apiClient.patch(API_ENDPOINTS.USERS.UPDATE, { name: name.trim() });
      await refetch();
      setIsEditing(false);
      Toast.show({ type: "success", text1: "Perfil atualizado" });
    } catch {
      Toast.show({ type: "error", text1: "Erro ao atualizar perfil" });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color="#d4a843" />
      </SafeAreaView>
    );
  }

  const initials = `${user?.name?.[0] ?? ""}`.toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Conta</Text>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {memberSince && (
            <Text style={styles.memberSince}>membro desde {memberSince}</Text>
          )}
        </View>

        {/* Editar nome */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Informações</Text>

          {isEditing ? (
            <View>
              <Text style={styles.fieldLabel}>Nome</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoFocus
              />
              <View style={styles.editActions}>
                <Pressable
                  onPress={() => setIsEditing(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveText}>Salvar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.fieldRow}>
              <View>
                <Text style={styles.fieldMeta}>Nome</Text>
                <Text style={styles.fieldValue}>{user?.name}</Text>
              </View>
              <Pressable
                onPress={() => { setName(user?.name ?? ""); setIsEditing(true); }}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>Editar</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.emailRow}>
            <View>
              <Text style={styles.fieldMeta}>Email</Text>
              <Text style={styles.fieldValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Stats rápidos */}
        {user?.bank && (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>Resumo da banca</Text>
            <View style={styles.statsRow}>
              {[
                { label: "Banca", value: `$${user.bank.bank.toFixed(2)}`, color: "#d4a843" },
                { label: "Lucro", value: `${user.bank.profit >= 0 ? "+" : ""}$${user.bank.profit.toFixed(2)}`, color: user.bank.profit >= 0 ? "#22c55e" : "#ef4444" },
              ].map((item) => (
                <View key={item.label} style={styles.statItem}>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={[styles.statValue, { color: item.color }]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sair */}
        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sair da conta</Text>
        </Pressable>
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
    marginBottom: 32,
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
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d4a84320",
    borderWidth: 1,
    borderColor: "#d4a843",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitials: {
    color: "#d4a843",
    fontSize: 24,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#f5f5f5",
  },
  userEmail: {
    fontSize: 14,
    color: "#555555",
    marginTop: 4,
  },
  memberSince: {
    fontSize: 12,
    color: "#333333",
    marginTop: 4,
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
  fieldLabel: {
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
  editActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
  },
  cancelText: {
    color: "#888888",
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#d4a843",
    alignItems: "center",
  },
  saveText: {
    color: "#0a0a0a",
    fontSize: 14,
    fontWeight: "600",
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldMeta: {
    fontSize: 12,
    color: "#555555",
  },
  fieldValue: {
    fontSize: 14,
    color: "#f5f5f5",
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  editButtonText: {
    fontSize: 12,
    color: "#888888",
  },
  emailRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.08,
    color: "#555555",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#ef444440",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  signOutText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
  },
});
