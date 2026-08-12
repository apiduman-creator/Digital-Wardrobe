import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const { width: SW } = Dimensions.get("window");
const C = Colors.light;

// ─── Step definitions ─────────────────────────────────────────────────────────

type WelcomeStep = { type: "welcome" };
type QuestionStep = { type: "question"; question: string; options: string[] };
type AiConsentStep = { type: "ai_consent" };
type CompleteStep = { type: "complete" };
type OnboardingStep = WelcomeStep | QuestionStep | AiConsentStep | CompleteStep;

const STEPS: OnboardingStep[] = [
  { type: "welcome" },
  {
    type: "question",
    question: "Her sabah ne giyeceğini bulmak\nne kadar sürüyor?",
    options: ["5 dakikadan az", "5–15 dakika", "15–30 dakika", "Çok uzun sürüyor"],
  },
  {
    type: "question",
    question: "Dolabın nasıl?",
    options: ["Minimalist & düzenli", "Orta dolu", "Oldukça dolu", "Taşıyor 😅"],
  },
  {
    type: "question",
    question: "Tarzın daha çok hangisi?",
    options: ["Casual & rahat", "Klasik & şık", "Sportif & aktif", "Her güne değişir"],
  },
  {
    type: "question",
    question: "Uygulamadan ne bekliyorsun?",
    options: ["Kombinleri kaydet", "Yeni fikirler bul", "Dolabı düzenle", "Hepsini"],
  },
  {
    type: "question",
    question: "Ne sıklıkla kıyafet alıyorsun?",
    options: ["Haftada bir", "Ayda bir", "Birkaç ayda bir", "Nadiren"],
  },
  {
    type: "question",
    question: "Kaç kıyafetin var?",
    options: ["20'den az", "20–50 arası", "50–100 arası", "100'den fazla"],
  },
  { type: "ai_consent" },
  { type: "complete" },
];

const QUESTION_COUNT = STEPS.filter((s) => s.type === "question" || s.type === "ai_consent").length;

const QUESTION_MASCOTS = [
  require("@/assets/images/mascot/suit.png"),
  require("@/assets/images/mascot/blazer.png"),
  require("@/assets/images/mascot/hoodie.png"),
  require("@/assets/images/mascot/sport.png"),
  require("@/assets/images/mascot/dress.png"),
  require("@/assets/images/mascot/coat.png"),
  require("@/assets/images/mascot/winter.png"),
  require("@/assets/images/mascot/casual.png"),
  require("@/assets/images/mascot/sweater.png"),
  require("@/assets/images/mascot/sundress.png"),
  require("@/assets/images/mascot/formal.png"),
  require("@/assets/images/mascot/beach.png"),
  require("@/assets/images/mascot/tshirt&jeans.png"),
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Reset selection when step changes
  useEffect(() => {
    setSelectedOption(null);
    setConsentChecked(false);
  }, [currentStep]);

  const goNext = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -SW,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep((s) => s + 1);
      slideAnim.setValue(SW * 0.25);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [slideAnim, fadeAnim]);

  const handleOptionSelect = useCallback(
    (index: number) => {
      if (selectedOption !== null) return;
      setSelectedOption(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Brief visual feedback before advancing
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.98, duration: 80, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
      setTimeout(goNext, 380);
    },
    [selectedOption, goNext, scaleAnim]
  );

  const handleAiConsent = useCallback(async () => {
    await AsyncStorage.setItem("ai_consent_given", "true");
    goNext();
  }, [goNext]);

  const handleComplete = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem("onboarding_completed", "true");
    router.replace("/(tabs)");
  }, [router]);

  const step = STEPS[currentStep];
  const questionIndex = currentStep - 1; // 0-based index among question steps

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* Decorative background circle */}
      <View style={styles.bgCircle} />

      {/* Progress dots — shown on question and ai_consent steps */}
      {(step.type === "question" || step.type === "ai_consent") && (
        <View style={styles.dotsRow}>
          {Array.from({ length: QUESTION_COUNT }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                i === questionIndex
                  ? styles.dotActive
                  : i < questionIndex
                  ? styles.dotDone
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Animated step container */}
      <Animated.View
        style={[
          styles.stepContainer,
          {
            transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* ── Welcome ─────────────────────────────────────────────────────── */}
        {step.type === "welcome" && (
          <View style={styles.centerContent}>
            <Image
              source={require("@/assets/images/mascot/shopping.png")}
              style={styles.mascotImage}
              resizeMode="contain"
            />

            <Text style={styles.welcomeTitle}>Merhaba!</Text>
            <Text style={styles.welcomeSubtitle}>Dijital gardırobun hazır.</Text>
            <Text style={styles.welcomeBody}>
              Kıyafetlerini kaydet, kombinlerini yönet ve her sabah ne giyeceğine
              kolayca karar ver.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={goNext}
            >
              <Text style={styles.primaryButtonText}>Başlayalım</Text>
              <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </Pressable>
          </View>
        )}

        {/* ── Question ────────────────────────────────────────────────────── */}
        {step.type === "question" && (
          <View style={styles.questionContent}>
            <Text style={styles.questionText}>{step.question}</Text>
            <View style={styles.optionsContainer}>
              {step.options.map((option, i) => {
                const isSelected = selectedOption === i;
                return (
                  <Pressable
                    key={i}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => handleOptionSelect(i)}
                    disabled={selectedOption !== null}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={16} color={C.tint} style={styles.optionCheck} />
                    )}
                  </Pressable>
                );
              })}
            </View>
            <Image
              source={QUESTION_MASCOTS[questionIndex % QUESTION_MASCOTS.length]}
              style={styles.questionMascot}
              resizeMode="contain"
            />
          </View>
        )}

        {/* ── AI Consent ──────────────────────────────────────────────────── */}
        {step.type === "ai_consent" && (
          <View style={styles.centerContent}>
            <Image
              source={require("@/assets/images/mascot/basic.png")}
              style={styles.mascotImage}
              resizeMode="contain"
            />

            <Text style={styles.welcomeTitle}>Yapay Zeka Nasıl Çalışıyor?</Text>
            <Text style={styles.welcomeBody}>
              Kıyafetini tanıyabilmemiz için fotoğrafını, yapay zeka ortağımız Anthropic&apos;e
              (Claude) güvenli şekilde gönderiyoruz. Analiz bitince fotoğrafın orada tutulmuyor.
            </Text>

            <Pressable
              style={styles.consentCheckRow}
              onPress={() => setConsentChecked((v) => !v)}
            >
              <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
                {consentChecked && <Feather name="check" size={14} color="#fff" />}
              </View>
              <Text style={styles.consentCheckText}>Anladım, devam ediyorum</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryButton, !consentChecked && styles.primaryButtonDisabled]}
              onPress={handleAiConsent}
              disabled={!consentChecked}
            >
              <Text style={styles.primaryButtonText}>Devam Et</Text>
              <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </Pressable>
          </View>
        )}

        {/* ── Complete ────────────────────────────────────────────────────── */}
        {step.type === "complete" && (
          <View style={styles.centerContent}>
            <Image
              source={require("@/assets/images/mascot/basic.png")}
              style={styles.mascotImage}
              resizeMode="contain"
            />

            <Text style={styles.welcomeTitle}>Gardırobin hazır!</Text>
            <Text style={styles.welcomeSubtitle}>Her şey seni bekliyor.</Text>
            <Text style={styles.welcomeBody}>
              Kıyafetlerini eklemeye ve harika kombinler oluşturmaya hemen başlayabilirsin.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={handleComplete}
            >
              <Text style={styles.primaryButtonText}>Hadi Başla</Text>
              <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
    overflow: "hidden",
  },

  // Decorative background element
  bgCircle: {
    position: "absolute",
    width: SW * 1.2,
    height: SW * 1.2,
    borderRadius: SW * 0.6,
    backgroundColor: C.tint,
    opacity: 0.04,
    top: -SW * 0.5,
    right: -SW * 0.3,
  },

  // Progress dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    marginBottom: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: C.tint,
  },
  dotDone: {
    width: 6,
    backgroundColor: C.tint,
    opacity: 0.4,
  },
  dotInactive: {
    width: 6,
    backgroundColor: C.cardBorder,
  },

  // Step container
  stepContainer: {
    flex: 1,
  },

  // ── Welcome / Complete shared ──────────────────────────────────────────────
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  questionMascot: {
    width: 260,
    height: 260,
    alignSelf: "center",
    marginTop: 16,
  },

  mascotImage: {
    width: 280,
    height: 280,
    marginBottom: 16,
  },

  welcomeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: C.text,
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    color: C.tint,
    textAlign: "center",
    marginBottom: 16,
  },
  welcomeBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.tint,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: C.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  primaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.3,
  },

  // ── AI Consent ────────────────────────────────────────────────────────────
  consentCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: C.tint,
    borderColor: C.tint,
  },
  consentCheckText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.text,
    flex: 1,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },

  // ── Question ──────────────────────────────────────────────────────────────
  questionContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  questionText: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: C.text,
    lineHeight: 32,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  optionCardSelected: {
    backgroundColor: "#FDF6EC",
    borderColor: C.tint,
  },
  optionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.text,
    flex: 1,
  },
  optionTextSelected: {
    color: C.tint,
    fontFamily: "Inter_600SemiBold",
  },
  optionCheck: {
    marginLeft: 8,
  },
});
