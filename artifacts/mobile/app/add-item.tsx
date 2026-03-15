import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors, { CATEGORIES, SEASONS, OCCASIONS, COLOR_PALETTE } from "@/constants/colors";
import { useCloset, Category, Season, Occasion } from "@/context/ClosetContext";

type SelectOption = { label: string; value: string };

function ChipSelector({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: SelectOption[];
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
                {
                  backgroundColor: isSelected ? C.tint : C.chip,
                  borderColor: isSelected ? C.tint : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? "#FFF" : C.textSecondary,
                    fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_500Medium",
                  },
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

export default function AddItemScreen() {
  const C = Colors.light;
  const { addItem } = useCloset();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("tops");
  const [colorName, setColorName] = useState("Black");
  const [colorHex, setColorHex] = useState("#1A1A1A");
  const [season, setSeason] = useState<Season>("all");
  const [occasion, setOccasion] = useState<Occasion>("casual");
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryOptions = CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
    label: c.label,
    value: c.id,
  }));

  const seasonOptions = SEASONS.map((s) => ({
    label: s === "all" ? "Tüm Mevsimler" : s.charAt(0).toUpperCase() + s.slice(1),
    value: s,
  }));

  const occasionOptions = OCCASIONS.map((o) => ({
    label: o.charAt(0).toUpperCase() + o.slice(1),
    value: o,
  }));

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Hata", "Ürün adı zorunludur.");
      return;
    }
    setSaving(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addItem({
      name: name.trim(),
      category,
      color: colorName,
      colorHex,
      brand: brand.trim() || undefined,
      season,
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
          <View style={styles.colorGrid}>
            {COLOR_PALETTE.map((color) => {
              const isSelected = colorName === color.name;
              return (
                <Pressable
                  key={color.name}
                  onPress={() => {
                    setColorName(color.name);
                    setColorHex(color.hex);
                  }}
                  style={styles.colorItem}
                >
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: color.hex },
                      color.name === "White" || color.name === "Cream"
                        ? { borderWidth: 1, borderColor: "#E0DAD2" }
                        : {},
                      isSelected
                        ? { borderWidth: 3, borderColor: C.tint }
                        : {},
                    ]}
                  >
                    {isSelected && (
                      <Feather
                        name="check"
                        size={13}
                        color={
                          color.name === "White" || color.name === "Cream" || color.name === "Yellow"
                            ? "#1A1A1A"
                            : "#FFF"
                        }
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.colorLabel,
                      { color: isSelected ? C.tint : C.textTertiary },
                    ]}
                  >
                    {color.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Season */}
        <ChipSelector
          label="Mevsim *"
          options={seasonOptions}
          selected={season}
          onSelect={(v) => setSeason(v as Season)}
        />

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
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: C.inputBackground, color: C.text },
            ]}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: C.backgroundSecondary, borderTopColor: C.separator }]}>
        <Pressable
          onPress={handleSave}
          disabled={saving || !name.trim()}
          style={[
            styles.saveBtn,
            { backgroundColor: name.trim() ? C.tint : C.chip },
          ]}
        >
          <Feather name="check" size={18} color={name.trim() ? "#FFF" : C.textTertiary} />
          <Text
            style={[
              styles.saveBtnText,
              { color: name.trim() ? "#FFF" : C.textTertiary },
            ]}
          >
            {saving ? "Kaydediliyor..." : "Gardıroba Ekle"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 120,
    gap: 24,
  },
  fieldGroup: {
    gap: 10,
  },
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
  textArea: {
    height: 90,
    textAlignVertical: "top",
    paddingTop: 13,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    textTransform: "capitalize",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorItem: {
    alignItems: "center",
    gap: 5,
    width: 48,
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  colorLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
