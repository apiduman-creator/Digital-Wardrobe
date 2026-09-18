import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

// ─── Palette — Atelier Couture (bkz. app/(tabs)/index.tsx, app/settings.tsx) ──
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
  tagBg:       "#F5EBD8",
  white:       "#FFFFFF",
};

// Backend kuralı: artifacts/api-server/src/routes/auth.ts —
// z.string().min(6, "Şifre en az 6 karakter olmalıdır.")
const MIN_PASSWORD_LENGTH = 6;

type Mode = "login" | "register";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Backend'in ham hata mesajını asla göstermiyoruz — bilinen durumlara göre
// genel bir Türkçe mesaja çeviriyoruz.
function toGenericMessage(mode: Mode, raw: string): string {
  const lower = raw.toLowerCase();
  const looksLikeNetworkIssue =
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("tanımlı değil") ||
    lower.includes("istek başarısız");
  if (looksLikeNetworkIssue) return "Bağlantı hatası, tekrar dene.";
  if (mode === "register" && raw.includes("zaten kayıtlı")) return "Bu e-posta zaten kayıtlı.";
  if (mode === "login") return "E-posta veya şifre hatalı.";
  return mode === "register"
    ? "Kayıt olurken bir sorun oluştu, bilgileri kontrol edip tekrar dene."
    : "Bağlantı hatası, tekrar dene.";
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const { register, login } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = mode === "login" ? "Giriş Yap" : "Kayıt Ol";
  const emailValid = isValidEmail(email);
  const passwordValid = password.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch = mode === "login" || password === passwordConfirm;
  const canSubmit = emailValid && passwordValid && passwordsMatch && !submitting;

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setPasswordConfirm("");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const action = mode === "login" ? login : register;
    const outcome = await action(email.trim(), password);
    setSubmitting(false);
    if (outcome.success) {
      router.back();
    } else {
      setError(toGenericMessage(mode, outcome.message));
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={styles.flexFill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.container, { paddingTop: topPad }]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <Feather name="chevron-left" size={22} color={P.accentGold} />
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Segment control */}
            <View style={styles.segment}>
              <Pressable
                onPress={() => switchMode("login")}
                style={[styles.segmentBtn, mode === "login" && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, mode === "login" && styles.segmentTextActive]}>
                  Giriş Yap
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchMode("register")}
                style={[styles.segmentBtn, mode === "register" && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, mode === "register" && styles.segmentTextActive]}>
                  Kayıt Ol
                </Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@eposta.com"
                placeholderTextColor={P.inkLight}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={`en az ${MIN_PASSWORD_LENGTH} karakter`}
                placeholderTextColor={P.inkLight}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            {mode === "register" && (
              <View style={styles.field}>
                <Text style={styles.label}>Şifre (Tekrar)</Text>
                <TextInput
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  placeholder="şifreni tekrar gir"
                  placeholderTextColor={P.inkLight}
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.input}
                />
                {passwordConfirm.length > 0 && !passwordsMatch && (
                  <Text style={styles.fieldError}>Şifreler eşleşmiyor</Text>
                )}
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={P.accent} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color={P.white} />
              ) : (
                <Text style={styles.submitBtnText}>{title}</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flexFill: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },

  // ── Header (settings.tsx ile birebir aynı desen) ────────────────────────────
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
  headerSpacer: {
    width: 38,
  },

  // ── Content ───────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 18,
  },

  // ── Segment control ──────────────────────────────────────────────────────────
  segment: {
    flexDirection: "row",
    backgroundColor: P.tagBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.border,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: P.accent,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: P.inkMid,
  },
  segmentTextActive: {
    color: P.white,
  },

  // ── Fields ────────────────────────────────────────────────────────────────────
  field: { gap: 8 },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: P.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: P.ink,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: P.accent,
  },

  // ── Error box ─────────────────────────────────────────────────────────────────
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.accent,
    backgroundColor: "#FFF0EE",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: P.accent,
  },

  // ── Submit ────────────────────────────────────────────────────────────────────
  submitBtn: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: P.accent,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    backgroundColor: P.inkLight,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: P.white,
  },
});
