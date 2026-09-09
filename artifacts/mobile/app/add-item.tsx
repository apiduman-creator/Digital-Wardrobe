import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors, { CATEGORIES, OCCASIONS } from "@/constants/colors";
import { useCloset, Category, Season, Occasion } from "@/context/ClosetContext";
import { SEASON_LABELS } from "@/utils/outfitLogic";
import { ColorSelector, ColorSelectorResult } from "@/components/ColorSelector";

const ITEM_SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

// ─── Single-select chip row ───────────────────────────────────────────────────
function ChipSelector({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (val: string) => void;
}) {
  const C = Colors.light;
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={[
                styles.chip,
                { backgroundColor: isSelected ? C.tint : C.chip, borderColor: isSelected ? C.tint : "transparent" },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? "#FFF" : C.textSecondary, fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_500Medium" },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Multi-select season chips ────────────────────────────────────────────────
function SeasonMultiSelect({
  selected,
  onToggle,
}: {
  selected: Season[];
  onToggle: (s: Season) => void;
}) {
  const C = Colors.light;
  const seasonIcons: Record<Season, string> = {
    spring: "🌸",
    summer: "☀️",
    fall: "🍂",
    winter: "❄️",
  };

  return (
    <View style={styles.fieldGroup}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: C.textSecondary }]}>Mevsim *</Text>
        {selected.length === 4 && (
          <Text style={[styles.labelHint, { color: C.tint }]}>Tüm mevsimler</Text>
        )}
        {selected.length === 0 && (
          <Text style={[styles.labelHint, { color: C.destructive }]}>En az 1 seçin</Text>
        )}
      </View>
      <View style={styles.chipWrap}>
        {ITEM_SEASONS.map((s) => {
          const isSelected = selected.includes(s);
          return (
            <Pressable
              key={s}
              onPress={() => onToggle(s)}
              style={[
                styles.seasonChip,
                {
                  backgroundColor: isSelected ? C.tint : C.chip,
                  borderColor: isSelected ? C.tint : "transparent",
                },
              ]}
            >
              <Text style={styles.seasonEmoji}>{seasonIcons[s]}</Text>
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? "#FFF" : C.textSecondary, fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_500Medium" },
                ]}
              >
                {SEASON_LABELS[s]}
              </Text>
              {isSelected && (
                <Feather name="check" size={13} color="#FFF" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddItemScreen() {
  const C = Colors.light;
  const { addItem } = useCloset();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("tops");
  const [colorResult, setColorResult] = useState<ColorSelectorResult | null>(null);
  // AI fotoğraf analizi bir renk tespit ettiğinde ColorSelector'ı o rengi
  // başlangıç seçimi olarak alacak şekilde yeniden mount etmek için kullanılır
  // (ColorSelector mount-sonrası dışarıdan kontrol edilemiyor, initialHex sadece
  // ilk render'da okunuyor).
  const [initialColorHex, setInitialColorHex] = useState<string | undefined>(undefined);
  const [colorSelectorKey, setColorSelectorKey] = useState(0);
  const [seasons, setSeasons] = useState<Season[]>(["spring", "summer", "fall", "winter"]);
  const [occasions, setOccasions] = useState<Occasion[]>(["casual"]);
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // ── AI Fotoğraf Analizi ───────────────────────────────────────────────────
  const [photoUri, setPhotoUri] = useState<string | null>(null);       // preview URI (temp)
  const [savedPhotoUri, setSavedPhotoUri] = useState<string | null>(null); // permanent URI
  const [analyzing, setAnalyzing] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  const analyzeImage = useCallback(async (base64: string, mimeType: string) => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      Alert.alert("Yapılandırma Hatası", "EXPO_PUBLIC_API_URL .env dosyasında tanımlı değil.");
      return;
    }
    console.log("[analyzeImage] fetch URL:", `${apiUrl}/api/analyze-clothing`);
    setAnalyzing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(`${apiUrl}/api/analyze-clothing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mimeType }),
        signal: controller.signal,
      });

      const data = await res.json() as {
        error?: string;
        not_clothing?: boolean;
        blocked?: boolean;
        strikes?: number;
        name?: string;
        category?: string;
        color?: string;
        colorHex?: string;
        brand?: string | null;
        occasions?: string[];
        seasons?: string[];
      };

      if (!res.ok) {
        if (data.not_clothing) {
          const msg = data.blocked
            ? data.error ?? "24 saat erişim engellendi."
            : data.error ?? "Fotoğrafta kıyafet tespit edilemedi.";
          Alert.alert("Kıyafet Bulunamadı", msg);
          return;
        }
        throw new Error(data.error ?? `Sunucu hatası: ${res.status}`);
      }

      const result = data;

      if (result.name) setName(result.name);

      if (result.category && CATEGORIES.some((c) => c.id === result.category)) {
        setCategory(result.category as Category);
      }

      if (result.brand) setBrand(result.brand);

      if (Array.isArray(result.occasions)) {
        const valid = result.occasions.filter((o) =>
          OCCASIONS.includes(o as Occasion)
        ) as Occasion[];
        if (valid.length > 0) setOccasions(valid);
      }

      if (Array.isArray(result.seasons)) {
        const valid = result.seasons.filter((s) =>
          ITEM_SEASONS.includes(s as Season)
        ) as Season[];
        if (valid.length > 0) setSeasons(valid);
      }

      if (result.colorHex) {
        const hex = result.colorHex.startsWith("#")
          ? result.colorHex.toUpperCase()
          : `#${result.colorHex.toUpperCase()}`;
        // ColorSelector'ı tespit edilen rengi başlangıç seçimi yaparak yeniden mount et
        setInitialColorHex(hex);
        setColorSelectorKey((k) => k + 1);
      }

      setAiDone(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        Alert.alert("Zaman Aşımı", "Analiz 60 saniyede tamamlanamadı. Lütfen tekrar deneyin.");
      } else {
        Alert.alert("Analiz Hatası", err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.");
      }
    } finally {
      clearTimeout(timeoutId);
      setAnalyzing(false);
    }
  }, []);

  const pickImage = useCallback(async (source: "camera" | "gallery") => {
    try {
      let pickerResult: ImagePicker.ImagePickerResult;
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 0.4,
        base64: false,
      };

      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("İzin Gerekli", "Kamera kullanmak için izin verin.");
          return;
        }
        pickerResult = await ImagePicker.launchCameraAsync(opts);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("İzin Gerekli", "Galeriye erişmek için izin verin.");
          return;
        }
        pickerResult = await ImagePicker.launchImageLibraryAsync(opts);
      }

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        const asset = pickerResult.assets[0];
        setPhotoUri(asset.uri);
        setAiDone(false);
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800, height: 800 } }],
          { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true },
        );
        // Kalıcı klasöre kaydet
        const dir = `${FileSystem.documentDirectory}closet-photos/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const filename = `${Date.now()}.jpg`;
        const dest = `${dir}${filename}`;
        await FileSystem.copyAsync({ from: manipulated.uri, to: dest });
        setSavedPhotoUri(dest);
        if (manipulated.base64) {
          const b64 = manipulated.base64;
          const showAnalysisAlert = () => {
            Alert.alert(
              "Fotoğrafı Analiz Et",
              "Bu fotoğrafı yapay zeka ile analiz etmek ister misiniz?",
              [
                { text: "Hayır", style: "cancel" },
                { text: "Evet", onPress: () => analyzeImage(b64, "image/jpeg") },
              ]
            );
          };
          const consentGiven = await AsyncStorage.getItem("ai_consent_given");
          if (consentGiven !== "true") {
            Alert.alert(
              "Yapay Zeka Nasıl Çalışıyor?",
              "Kıyafetini tanıyabilmemiz için fotoğrafını, yapay zeka ortağımız Anthropic'e (Claude) güvenli şekilde gönderiyoruz. Analiz bitince fotoğrafın orada tutulmuyor.",
              [
                { text: "Vazgeç", style: "cancel" },
                {
                  text: "Anladım, Devam Et",
                  onPress: async () => {
                    await AsyncStorage.setItem("ai_consent_given", "true");
                    showAnalysisAlert();
                  },
                },
              ]
            );
          } else {
            showAnalysisAlert();
          }
        }
      }
    } catch (error) {
      console.error("pickImage hatası:", error);
      Alert.alert("Hata", "Fotoğraf seçilirken sorun oluştu.");
    }
  }, [analyzeImage]);
  // ─────────────────────────────────────────────────────────────────────────

  const toggleSeason = (s: Season) => {
    setSeasons((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleOccasion = (o: Occasion) => {
    setOccasions((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
    );
  };

  const categoryOptions = CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
    label: c.label,
    value: c.id,
  }));

  const OCCASION_LABELS: Record<string, string> = {
    casual: "Günlük", work: "İş", formal: "Resmi",
    sport: "Spor", lounge: "Ev", special: "Özel",
  };
  const occasionOptions = OCCASIONS.map((o) => ({
    label: OCCASION_LABELS[o] ?? o,
    value: o,
  }));

  const canSave = name.trim().length > 0 && seasons.length > 0 && occasions.length > 0;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Hata", "Ürün adı zorunludur.");
      return;
    }
    if (seasons.length === 0) {
      Alert.alert("Hata", "En az bir mevsim seçmelisiniz.");
      return;
    }
    if (occasions.length === 0) {
      Alert.alert("Hata", "En az bir kullanım amacı seçmelisiniz.");
      return;
    }
    setSaving(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addItem({
      name: name.trim(),
      category,
      color: colorResult?.colorLabel ?? "Siyah",
      colorHex: colorResult?.colorHex ?? "#1A1A1A",
      brand: brand.trim() || undefined,
      seasons,
      occasion: JSON.stringify(occasions),
      imageUri: savedPhotoUri || undefined,
      notes: notes.trim() || undefined,
      favorite: false,
    });
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: C.backgroundSecondary }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── AI Fotoğraf Analizi ──────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: C.textSecondary }]}>AI ile Otomatik Doldur</Text>
            {aiDone && (
              <View style={styles.aiDoneBadge}>
                <Feather name="check-circle" size={11} color="#34C759" />
                <Text style={styles.aiDoneBadgeText}>Tamamlandı</Text>
              </View>
            )}
          </View>

          {!photoUri ? (
            <View style={styles.photoButtons}>
              <Pressable
                onPress={() => pickImage("camera")}
                style={[styles.photoBtn, { backgroundColor: C.chip }]}
              >
                <Feather name="camera" size={18} color={C.tint} />
                <Text style={[styles.photoBtnText, { color: C.text }]}>Fotoğraf Çek</Text>
              </Pressable>
              <Pressable
                onPress={() => pickImage("gallery")}
                style={[styles.photoBtn, { backgroundColor: C.chip }]}
              >
                <Feather name="image" size={18} color={C.tint} />
                <Text style={[styles.photoBtnText, { color: C.text }]}>Galeriden Seç</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoPreviewRow}>
              {/* Küçük önizleme */}
              <View>
                <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                {analyzing && (
                  <View style={styles.photoOverlay}>
                    <ActivityIndicator color="#FFF" size="small" />
                  </View>
                )}
              </View>

              {/* Durum + aksiyonlar */}
              <View style={styles.photoInfoCol}>
                {analyzing ? (
                  <>
                    <Text style={[styles.photoStatusTitle, { color: C.tint }]}>Analiz ediliyor…</Text>
                    <Text style={[styles.photoStatusSub, { color: C.textTertiary }]}>AI kıyafeti tanıyor</Text>
                  </>
                ) : aiDone ? (
                  <>
                    <Text style={[styles.photoStatusTitle, { color: "#34C759" }]}>AI tamamladı ✓</Text>
                    <Text style={[styles.photoStatusSub, { color: C.textTertiary }]}>Alanları düzenleyebilirsiniz</Text>
                  </>
                ) : (
                  <Text style={[styles.photoStatusSub, { color: C.textTertiary }]}>Fotoğraf seçildi</Text>
                )}

                <View style={styles.photoActionRow}>
                  <Pressable
                    onPress={() => pickImage("camera")}
                    disabled={analyzing}
                    style={[styles.photoSmallBtn, { backgroundColor: C.chip }]}
                  >
                    <Feather name="camera" size={13} color={C.textSecondary} />
                  </Pressable>
                  <Pressable
                    onPress={() => pickImage("gallery")}
                    disabled={analyzing}
                    style={[styles.photoSmallBtn, { backgroundColor: C.chip }]}
                  >
                    <Feather name="image" size={13} color={C.textSecondary} />
                  </Pressable>
                  <Pressable
                    onPress={() => { setPhotoUri(null); setAiDone(false); }}
                    disabled={analyzing}
                    style={[styles.photoSmallBtn, { backgroundColor: C.chip }]}
                  >
                    <Feather name="x" size={13} color={C.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Bölücü */}
        <View style={[styles.divider, { backgroundColor: C.separator }]} />

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: C.textSecondary }]}>Ürün Adı *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="ör. Beyaz Oxford Gömlek"
            placeholderTextColor={C.textTertiary}
            style={[styles.input, { backgroundColor: C.inputBackground, color: C.text }]}
          />
        </View>

        {/* Brand */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: C.textSecondary }]}>Marka (opsiyonel)</Text>
          <TextInput
            value={brand}
            onChangeText={setBrand}
            placeholder="ör. Zara, H&M"
            placeholderTextColor={C.textTertiary}
            style={[styles.input, { backgroundColor: C.inputBackground, color: C.text }]}
          />
        </View>

        {/* Category */}
        <ChipSelector
          label="Kategori *"
          options={categoryOptions}
          selected={category}
          onSelect={(v) => setCategory(v as Category)}
        />

        {/* Color */}
        <ColorSelector
          key={colorSelectorKey}
          required
          initialHex={initialColorHex}
          onChange={setColorResult}
        />

        {/* Season — multi-select */}
        <SeasonMultiSelect selected={seasons} onToggle={toggleSeason} />

        {/* Occasion — multi-select */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Kullanım *</Text>
            {occasions.length === 0 && (
              <Text style={[styles.labelHint, { color: C.destructive }]}>En az 1 seçin</Text>
            )}
          </View>
          <View style={styles.chipWrap}>
            {occasionOptions.map((opt) => {
              const isSelected = occasions.includes(opt.value as Occasion);
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => toggleOccasion(opt.value as Occasion)}
                  style={[
                    styles.chip,
                    { backgroundColor: isSelected ? C.tint : C.chip, borderColor: isSelected ? C.tint : "transparent" },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? "#FFF" : C.textSecondary, fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_500Medium" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && <Feather name="check" size={12} color="#FFF" />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: C.textSecondary }]}>Notlar (opsiyonel)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Eklemek istediğiniz bir not..."
            placeholderTextColor={C.textTertiary}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea, { backgroundColor: C.inputBackground, color: C.text }]}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: C.backgroundSecondary, borderTopColor: C.separator }]}>
        <Pressable
          onPress={handleSave}
          disabled={saving || !canSave}
          style={[styles.saveBtn, { backgroundColor: canSave ? C.tint : C.chip }]}
        >
          <Feather name="check" size={18} color={canSave ? "#FFF" : C.textTertiary} />
          <Text style={[styles.saveBtnText, { color: canSave ? "#FFF" : C.textTertiary }]}>
            {saving ? "Kaydediliyor..." : "Gardıroba Ekle"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 120, gap: 24 },
  fieldGroup: { gap: 10 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
  labelHint: { fontSize: 11, fontFamily: "Inter_500Medium" },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  textArea: { height: 90, textAlignVertical: "top", paddingTop: 13 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  seasonChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  seasonEmoji: { fontSize: 15 },
  chipText: { fontSize: 13, textTransform: "capitalize" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === "ios" ? 36 : 20, borderTopWidth: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, gap: 8 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },

  // AI fotoğraf analizi
  divider: { height: 1 },
  aiDoneBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  aiDoneBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#34C759" },
  photoButtons: { flexDirection: "row", gap: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  photoBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  photoPreviewRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  photoThumb: { width: 80, height: 80, borderRadius: 12 },
  photoOverlay: {
    position: "absolute", top: 0, left: 0, width: 80, height: 80,
    backgroundColor: "rgba(0,0,0,0.50)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  photoInfoCol: { flex: 1, gap: 4, paddingTop: 2 },
  photoStatusTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  photoStatusSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  photoActionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  photoSmallBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
