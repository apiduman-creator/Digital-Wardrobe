import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { ACCOUNTS_ENABLED } from "@/constants/features";

// Apple 5.1.1(i): gizlilik politikası uygulama içinden kolayca erişilebilir olmalı.
const PRIVACY_POLICY_URL = "https://apiduman-creator.github.io/Digital-Wardrobe/";
const APP_VERSION = Constants.expoConfig?.version ?? "";

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

        {/* v1.0'da hesap kapalı (bkz. constants/features.ts) */}
        {ACCOUNTS_ENABLED && (
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
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HAKKINDA</Text>
          <View style={styles.listCard}>
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={styles.rowText}>Gizlilik Politikası</Text>
              <Feather name="external-link" size={16} color={P.inkLight} />
            </Pressable>
            <View style={styles.rowDivider} />
            <View style={styles.row}>
              <Text style={styles.rowText}>Sürüm</Text>
              <Text style={styles.rowValue}>{APP_VERSION}</Text>
            </View>
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

  // ── Hakkında listesi ──────────────────────────────────────────────────────────
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.cardBg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowPressed: {
    backgroundColor: P.borderLight,
  },
  rowText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: P.ink,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: P.inkLight,
  },
  rowDivider: {
    height: 1,
    backgroundColor: P.borderLight,
    marginLeft: 16,
  },
});
