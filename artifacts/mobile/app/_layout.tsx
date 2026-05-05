import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Pressable } from "react-native";
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

function RootLayoutNav({ initialRoute }: { initialRoute: "onboarding" | "(tabs)" }) {
  const router = useRouter();

  useEffect(() => {
    if (initialRoute === "onboarding") {
      router.replace("/onboarding");
    }
  }, []);

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
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
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
        options={{
          title: "Ürün Detayı",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: 12, padding: 6 }}>
              <Feather name="chevron-left" size={22} color={C.tint} />
            </Pressable>
          ),
        }}
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
        options={{
          title: "Kombin Detayı",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: 12, padding: 6 }}>
              <Feather name="chevron-left" size={22} color={C.tint} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="create-outfit-manual"
        options={{
          title: "Manuel Kombin Kur",
          headerStyle: { backgroundColor: C.backgroundSecondary },
        }}
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
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("onboarding_completed").then((val) => {
      console.log("[RootLayout] onboarding_completed raw value:", val);
      const done = !!val;
      setOnboardingDone(done);
      setOnboardingChecked(true);
      console.log("[RootLayout] initialRoute →", done ? "(tabs)" : "onboarding");
    });
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && onboardingChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, onboardingChecked]);

  if ((!fontsLoaded && !fontError) || !onboardingChecked) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <ClosetProvider>
                <CalendarProvider>
                  <RootLayoutNav initialRoute={onboardingDone ? "(tabs)" : "onboarding"} />
                </CalendarProvider>
              </ClosetProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
