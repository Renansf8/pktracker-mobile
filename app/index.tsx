import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { authStorage } from "@/lib/auth/storage";

SplashScreen.preventAutoHideAsync();

export default function Index() {
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await authStorage.getToken();
        if (token) {
          router.replace("/(protected)");
        } else {
          router.replace("/(auth)/signin");
        }
      } catch {
        router.replace("/(auth)/signin");
      } finally {
        SplashScreen.hideAsync();
      }
    }
    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#d4a843" />
    </View>
  );
}
