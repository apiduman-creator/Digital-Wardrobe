import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const C = Colors.light;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function AuthTestScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"register" | "login" | null>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { register, login, token } = useAuth();

  const validate = () => {
    if (!isValidEmail(email)) {
      setResult({ type: "error", message: "Geçerli bir e-posta adresi girin." });
      return false;
    }
    if (password.length < 8) {
      setResult({ type: "error", message: "Şifre en az 8 karakter olmalı." });
      return false;
    }
    return true;
  };

  const callAuth = async (endpoint: "register" | "login") => {
    setResult(null);
    if (!validate()) return;
    setLoading(endpoint);
    const action = endpoint === "register" ? register : login;
    const outcome = await action(email, password);
    if (outcome.success) {
      setResult({ type: "success", message: token ?? "Token alındı, ama context henüz güncellenmedi." });
    } else {
      setResult({ type: "error", message: outcome.message });
    }
    setLoading(null);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Auth Test" }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: C.text }]}>Hesap Testi</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>
            Bu ekran geçici bir test aracıdır — sadece backend'in register/login uçlarının
            doğru çalıştığını doğrulamak için var, kalıcı bir giriş akışı değildir.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: C.textSecondary }]}>E-posta</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="ör. test@example.com"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={[styles.input, { backgroundColor: C.inputBackground, color: C.text }]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Şifre</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="en az 8 karakter"
              placeholderTextColor={C.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: C.inputBackground, color: C.text }]}
            />
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => callAuth("register")}
              disabled={loading !== null}
              style={[styles.secondaryButton, { backgroundColor: C.chip, opacity: loading ? 0.6 : 1 }]}
            >
              {loading === "register" ? (
                <ActivityIndicator color={C.tintDark} />
              ) : (
                <Text style={[styles.secondaryButtonText, { color: C.text }]}>Kayıt Ol</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => callAuth("login")}
              disabled={loading !== null}
              style={[styles.primaryButton, { backgroundColor: C.tint, opacity: loading ? 0.6 : 1 }]}
            >
              {loading === "login" ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Giriş Yap</Text>
              )}
            </Pressable>
          </View>

          {result && (
            <View
              style={[
                styles.resultBox,
                {
                  backgroundColor: result.type === "error" ? "#FCEAEA" : C.backgroundSecondary,
                  borderColor: result.type === "error" ? C.destructive : C.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultLabel,
                  { color: result.type === "error" ? C.destructive : C.success },
                ]}
              >
                {result.type === "error" ? "Hata" : "Başarılı — token alındı"}
              </Text>
              <Text selectable style={[styles.resultText, { color: C.text }]}>
                {result.message}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 18 },
  title: { fontSize: 24, fontFamily: "PlayfairDisplay_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: -8 },
  fieldGroup: { gap: 10 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  primaryButton: {
    shadowColor: C.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  resultBox: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 6 },
  resultLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  resultText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
});
