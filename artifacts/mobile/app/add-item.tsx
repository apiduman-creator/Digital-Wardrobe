import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors, { CATEGORIES, OCCASIONS, COLOR_PALETTE } from "@/constants/colors";
import { useCloset, Category, Season, Occasion } from "@/context/ClosetContext";
import { SEASON_LABELS } from "@/utils/outfitLogic";
import { LinearGradient } from "expo-linear-gradient";
import WheelColorPicker from "react-native-wheel-color-picker";

const ITEM_SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

type ColorOption = { id: string; name: string; hex: string };

const BASE_COLORS: ColorOption[] = COLOR_PALETTE.map((c) => ({
  id: c.name,
  name: c.name,
  hex: c.hex,
}));

const RAINBOW_GRADIENT = [
  "#FF3B30", // red
  "#FF9500", // orange
  "#FFCC00", // yellow
  "#34C759", // green
  "#0A84FF", // blue
  "#5E5CE6", // indigo
  "#BF5AF2", // violet
  "#FF3B30",
] as const;

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
  // Color selection uses color IDs (base palette: `Black`, custom palette: `custom:#RRGGBB`)
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>(["Black"]);
  const [customColors, setCustomColors] = useState<ColorOption[]>([]);
  const [wheelVisible, setWheelVisible] = useState(false);
  const [wheelHex, setWheelHex] = useState("#1A1A1A");
  const [seasons, setSeasons] = useState<Season[]>(["spring", "summer", "fall", "winter"]);
  const [occasion, setOccasion] = useState<Occasion>("casual");
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleSeason = (s: Season) => {
    setSeasons((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const categoryOptions = CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
    label: c.label,
    value: c.id,
  }));

  const occasionOptions = OCCASIONS.map((o) => ({
    label: o.charAt(0).toUpperCase() + o.slice(1),
    value: o,
  }));

  const canSave = name.trim().length > 0 && seasons.length > 0;

  const availableColors = useMemo(() => [...BASE_COLORS, ...customColors], [customColors]);

  const selectedColors = useMemo(
    () => availableColors.filter((c) => selectedColorIds.includes(c.id)),
    [availableColors, selectedColorIds]
  );

  const primaryColor = selectedColors[0] ?? BASE_COLORS[0];
  const secondaryColor = selectedColors[1];

  const isRainbow = selectedColors.length >= 3;

  const handleCustomColorSelected = useCallback((hex: string) => {
    const normalized = hex.toUpperCase();
    const customId = `custom:${normalized}`;
    const customName = `Özel ${normalized}`;

    setCustomColors((prev) => {
      if (prev.some((c) => c.id === customId)) return prev;
      return [...prev, { id: customId, name: customName, hex: normalized }];
    });
    setSelectedColorIds((prev) => (prev.includes(customId) ? prev : [...prev, customId]));
    setWheelVisible(false);
  }, []);

  const colorLabel = useMemo(() => {
    if (selectedColors.length <= 1) return primaryColor.name;
    if (selectedColors.length === 2) return `${primaryColor.name} + ${secondaryColor?.name}`;
    return "Çok Renkli";
  }, [primaryColor.name, secondaryColor?.name, selectedColors.length]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Hata", "Ürün adı zorunludur.");
      return;
    }
    if (seasons.length === 0) {
      Alert.alert("Hata", "En az bir mevsim seçmelisiniz.");
      return;
    }
    setSaving(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addItem({
      name: name.trim(),
      category,
      color: colorLabel,
      colorHex: primaryColor.hex,
      brand: brand.trim() || undefined,
      seasons,
      occasion,
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
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: C.textSecondary }]}>Renk *</Text>
          <View style={styles.selectedColorPreviewRow}>
            {isRainbow ? (
              <LinearGradient
                colors={RAINBOW_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.selectedColorDotRainbow}
              />
            ) : (
              <View
                style={[
                  styles.selectedColorDot,
                  {
                    backgroundColor: selectedColors.length === 0 ? "#E0E0E0" : primaryColor.hex,
                    borderColor:
                      selectedColors.length === 2 && secondaryColor
                        ? secondaryColor.hex
                        : "transparent",
                    borderWidth: selectedColors.length === 2 ? 3 : 0,
                  },
                ]}
              />
            )}
            <Text style={[styles.selectedColorLabel, { color: C.textSecondary }]}>
              {colorLabel}
            </Text>
          </View>
          <View style={styles.colorGrid}>
            {availableColors.map((color) => {
              const isSelected = selectedColorIds.includes(color.id);
              return (
                <Pressable
                  key={color.id}
                  onPress={() => {
                    setSelectedColorIds((prev) =>
                      prev.includes(color.id)
                        ? prev.filter((n) => n !== color.id)
                        : [...prev, color.id]
                    );
                  }}
                  style={styles.colorItem}
                >
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: color.hex },
                      (color.name === "White" || color.name === "Cream")
                        ? { borderWidth: 1, borderColor: "#E0DAD2" }
                        : {},
                      isSelected ? { borderWidth: 3, borderColor: C.tint } : {},
                    ]}
                  >
                    {isSelected && (
                      <Feather
                        name="check"
                        size={13}
                        color={["White", "Cream", "Yellow"].includes(color.name) ? "#1A1A1A" : "#FFF"}
                      />
                    )}
                  </View>
                  <Text style={[styles.colorLabel, { color: isSelected ? C.tint : C.textTertiary }]}>
                    {color.name}
                  </Text>
                </Pressable>
              );
            })}

            {/* Premium: custom color */}
            <Pressable
              onPress={() => {
                setWheelHex(primaryColor.hex);
                setWheelVisible(true);
              }}
              style={[styles.colorItem, styles.plusColorItem]}
            >
              <View style={[styles.colorDot, styles.plusColorDot, { borderColor: C.tint }]}>
                <Feather name="plus" size={18} color={C.tint} />
              </View>
              <Text style={[styles.colorLabel, { color: C.tint }]}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Advanced: color wheel */}
        {wheelVisible && (
          <Modal transparent animationType="slide" visible onRequestClose={() => setWheelVisible(false)}>
            <View style={styles.wheelModalOverlay}>
              <View style={[styles.wheelModal, { backgroundColor: C.backgroundSecondary }]}>
                <View style={styles.wheelHeader}>
                  <Text style={[styles.wheelTitle, { color: C.text }]}>Özel Renk</Text>
                  <Pressable
                    onPress={() => setWheelVisible(false)}
                    style={[styles.wheelCloseBtn, { backgroundColor: C.chip }]}
                    hitSlop={10}
                  >
                    <Feather name="x" size={18} color={C.textSecondary} />
                  </Pressable>
                </View>
                <View style={styles.wheelBody}>
                  <WheelColorPicker
                    color={wheelHex}
                    onColorChangeComplete={(hex) => handleCustomColorSelected(hex)}
                    thumbSize={38}
                    sliderSize={20}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Season — multi-select */}
        <SeasonMultiSelect selected={seasons} onToggle={toggleSeason} />

        {/* Occasion */}
        <ChipSelector
          label="Kullanım *"
          options={occasionOptions}
          selected={occasion}
          onSelect={(v) => setOccasion(v as Occasion)}
        />

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
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
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
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  colorItem: { alignItems: "center", gap: 5, width: 48 },
  colorDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  colorLabel: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center" },
  selectedColorPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  selectedColorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectedColorDotRainbow: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectedColorLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  plusColorItem: {
    marginLeft: 2,
  },
  plusColorDot: {
    borderWidth: 2,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  // Color wheel modal
  wheelModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  wheelModal: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 360,
    gap: 12,
  },
  wheelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  wheelTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  wheelCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === "ios" ? 36 : 20, borderTopWidth: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, gap: 8 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
