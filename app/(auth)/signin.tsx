import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { authStorage } from "@/lib/auth/storage";
import { apiClient } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { LoginResponse } from "@/services/api/types";
import Toast from "react-native-toast-message";

const signInSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(8, { message: "Senha deve ter pelo menos 8 caracteres" }),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        data,
      );
      await authStorage.setToken(response.data.accessToken);
      router.replace("/(protected)");
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = axiosError?.response?.status;
      const serverMessage = axiosError?.response?.data?.message;

      if (status === 401 || status === 403) {
        Toast.show({ type: "error", text1: "Credenciais inválidas" });
      } else if (serverMessage) {
        Toast.show({ type: "error", text1: serverMessage });
      } else {
        Toast.show({
          type: "error",
          text1: "Erro de conexão",
          text2: axiosError?.message ?? "Verifique se o servidor está acessível",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <View style={styles.header}>
              <Text style={styles.headerEyebrow}>Bem-vindo de volta</Text>
              <Text style={styles.headerTitle}>PKTracker</Text>
              <Text style={styles.headerDescription}>
                Faça login para continuar
              </Text>
            </View>

            <View style={styles.form}>
              <View>
                <Text style={styles.label}>Email</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="seu@email.com"
                      placeholderTextColor="#555555"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </View>

              <View>
                <Text style={styles.label}>Senha</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#555555"
                      secureTextEntry
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.password && (
                  <Text style={styles.errorText}>
                    {errors.password.message}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.button,
                  { opacity: isLoading ? 0.7 : pressed ? 0.8 : 1 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0a0a0a" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => router.push("/(auth)/signup")}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>
                  Não tem conta?{" "}
                  <Text style={styles.linkHighlight}>Cadastre-se</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  flex: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 48,
  },
  headerEyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    color: "#888888",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#f5f5f5",
  },
  headerDescription: {
    fontSize: 14,
    color: "#555555",
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.44,
    color: "#888888",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#f5f5f5",
    fontSize: 14,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#d4a843",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#0a0a0a",
    fontWeight: "600",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  linkButton: {
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    color: "#555555",
    fontSize: 14,
  },
  linkHighlight: {
    color: "#d4a843",
  },
});
