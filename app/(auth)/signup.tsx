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

const signUpSchema = z
  .object({
    name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
    lastName: z.string().min(2, { message: "Sobrenome deve ter pelo menos 2 caracteres" }),
    email: z.string().email({ message: "Email inválido" }),
    password: z.string().min(8, { message: "Senha deve ter pelo menos 8 caracteres" }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      const loginRes = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        email: data.email,
        password: data.password,
      });
      await authStorage.setToken(loginRes.data.accessToken);
      router.replace("/(protected)");
    } catch {
      Toast.show({ type: "error", text1: "Erro ao criar conta. Tente novamente." });
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
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Voltar</Text>
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.headerEyebrow}>Criar conta</Text>
              <Text style={styles.headerTitle}>PKTracker</Text>
              <Text style={styles.headerDescription}>Comece a rastrear seus resultados</Text>
            </View>

            <View style={styles.form}>
              {(
                [
                  { name: "name" as const, label: "Nome", placeholder: "Renan" },
                  { name: "lastName" as const, label: "Sobrenome", placeholder: "Ferreira" },
                  { name: "email" as const, label: "Email", placeholder: "seu@email.com", keyboard: "email-address" as const, autoCapitalize: "none" as const },
                  { name: "password" as const, label: "Senha", placeholder: "••••••••", secure: true },
                  { name: "confirmPassword" as const, label: "Confirmar Senha", placeholder: "••••••••", secure: true },
                ]
              ).map((field) => (
                <View key={field.name}>
                  <Text style={styles.label}>{field.label}</Text>
                  <Controller
                    control={control}
                    name={field.name}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder={field.placeholder}
                        placeholderTextColor="#555555"
                        keyboardType={field.keyboard ?? "default"}
                        autoCapitalize={field.autoCapitalize ?? "words"}
                        secureTextEntry={field.secure ?? false}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors[field.name] && (
                    <Text style={styles.errorText}>
                      {errors[field.name]?.message}
                    </Text>
                  )}
                </View>
              ))}

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
                  <Text style={styles.buttonText}>Criar conta</Text>
                )}
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
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 32,
  },
  backText: {
    color: "#d4a843",
    fontSize: 14,
  },
  header: {
    marginBottom: 32,
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
});
