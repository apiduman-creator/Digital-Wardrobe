import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

// ─── Palette — Atelier Couture (bkz. app/(tabs)/index.tsx) ────────────────────
const P = {
  bg:          "#F9F3EA",
  ink:         "#2C1A0E",
  inkMid:      "#7B5A45",
  inkLight:    "#A88B75",
  accent:      "#C84B4B",
  accentGold:  "#C9A96E",
  cardBg:      "#FFFDF7",
  border:      "#DDD0BC",
  borderLight: "#EDE3D5",
  white:       "#FFFFFF",
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  // AuthContext token'ı saklıyor ama kullanıcı email'ini tutmuyor
  // (bkz. context/AuthContext.tsx — AuthContextType'ta email alanı yok),
  // bu yüzden burada gösterilecek bir email'imiz yok.
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={P.accentGold} />
          </Pressable>
          <Text style={styles.title}>Ayarlar</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HESAP</Text>
          <View style={styles.card}>
            {isAuthenticated ? (
              <>
                <Text style={styles.cardText}>Giriş yapıldı</Text>
                <Pressable onPress={logout} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Çıkış Yap</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.cardText}>Giriş yapılmadı</Text>
                <Pressable onPress={() => router.push("/auth")} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Giriş Yap / Kayıt Ol</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.borderLight,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "PlayfairDisplay_700Bold",
    color: P.ink,
    letterSpacing: -0.3,
  },
  // Balances the back button's width so the title stays visually centered
  // in the remaining space (no shadow — hairline border used instead).
  headerSpacer: {
    width: 38,
  },

  // ── Content ───────────────────────────────────────────────────────────────────
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: P.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  cardText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: P.inkMid,
  },
  primaryBtn: {
    borderRadius: 12,
    backgroundColor: P.accent,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: P.white,
  },
  secondaryBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: P.inkMid,
  },
});
