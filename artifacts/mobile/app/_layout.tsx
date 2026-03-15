import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClosetProvider } from "@/context/ClosetContext";
import { CalendarProvider } from "@/context/CalendarContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const C = Colors.light;

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Geri",
        headerStyle: { backgroundColor: C.background },
        headerTintColor: C.tint,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold", color: C.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-item"
        options={{
          title: "Yeni Ürün",
          presentation: "modal",
          headerStyle: { backgroundColor: C.backgroundSecondary },
        }}
      />
      <Stack.Screen
        name="item/[id]"
        options={{ title: "Ürün Detayı" }}
      />
      <Stack.Screen
        name="add-outfit"
        options={{
          title: "Kombin Oluştur",
          presentation: "modal",
          headerStyle: { backgroundColor: C.backgroundSecondary },
        }}
      />
      <Stack.Screen
        name="outfit/[id]"
        options={{ title: "Kombin Detayı" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <ClosetProvider>
                <CalendarProvider>
                  <RootLayoutNav />
                </CalendarProvider>
              </ClosetProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
