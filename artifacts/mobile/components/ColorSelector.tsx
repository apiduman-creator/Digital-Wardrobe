import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import WheelColorPicker from "react-native-wheel-color-picker";
import Colors, { COLOR_PALETTE } from "@/constants/colors";
import { hexToColorName } from "@/utils/colorName";

type ColorOption = { id: string; name: string; nameTr?: string; hex: string };

const BASE_COLORS: ColorOption[] = COLOR_PALETTE.map((c) => ({
  id: c.name,
  name: c.name,
  nameTr: c.nameTr,
  hex: c.hex,
}));

const RAINBOW_GRADIENT = [
  "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#0A84FF", "#5E5CE6", "#BF5AF2", "#FF3B30",
] as const;

export type ColorSelectorResult = {
  colorLabel: string;
  colorHex: string;
  selectedColorIds: string[];
};

type ColorSelectorProps = {
  initialHex?: string;
  required?: boolean;
  size?: "default" | "compact";
  onChange: (result: ColorSelectorResult) => void;
};

export function ColorSelector({ initialHex, required, size = "default", onChange }: ColorSelectorProps) {
  const C = Colors.light;
  const sizing = size === "compact" ? compactSizing : defaultSizing;

  // Color selection uses color IDs (base palette: `Black`, custom palette: `custom:#RRGGBB`)
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>(() => {
    if (!initialHex) return ["Black"];
    const hex = initialHex.toUpperCase();
    const base = BASE_COLORS.find((c) => c.hex.toUpperCase() === hex);
    return base ? [base.id] : [`custom:${hex}`];
  });
  const [customColors, setCustomColors] = useState<ColorOption[]>(() => {
    if (!initialHex) return [];
    const hex = initialHex.toUpperCase();
    const base = BASE_COLORS.find((c) => c.hex.toUpperCase() === hex);
    if (base) return [];
    // hexToColorName ile hesapla — item.color "Çok Renkli" gibi bir değer olabilir
    return [{ id: `custom:${hex}`, name: hexToColorName(hex), hex }];
  });
  const [wheelVisible, setWheelVisible] = useState(false);
  const [wheelHex, setWheelHex] = useState("#E74C3C");
  // Picker'a geçilen stabil başlangıç rengi — state değil ref, böylece
  // onColorChange → setWheelHex render döngüsü picker thumb'ını sıfırlamaz
  const wheelInitialColorRef = useRef("#E74C3C");
  const [wheelPickerKey, setWheelPickerKey] = useState(0);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [colorMenuColorId, setColorMenuColorId] = useState<string | null>(null);

  const availableColors = useMemo(() => [...BASE_COLORS, ...customColors], [customColors]);

  const selectedColors = useMemo(
    () => availableColors.filter((c) => selectedColorIds.includes(c.id)),
    [availableColors, selectedColorIds]
  );

  const primaryColor = selectedColors[0] ?? BASE_COLORS[0];
  const secondaryColor = selectedColors[1];

  const isRainbow = selectedColors.length >= 3;

  // Sadece wheelHex state'ini günceller — modal kapanmaz
  // react-native-wheel-color-picker bazen '#' olmadan hex döndürür, normalize et
  const handleWheelColorChange = useCallback((hex: string) => {
    const normalized = hex.startsWith("#") ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
    setWheelHex(normalized);
  }, []);

  // Onay butonuna basınca çağrılır
  const handleConfirmCustomColor = useCallback(() => {
    // '#' prefix garantisi — picker bazen olmadan döndürebilir
    const normalized = wheelHex.startsWith("#") ? wheelHex.toUpperCase() : `#${wheelHex.toUpperCase()}`;
    const humanName = hexToColorName(normalized);

    if (editingColorId) {
      // Mevcut custom rengi güncelle
      const newId = `custom:${normalized}`;
      setCustomColors((prev) =>
        prev.map((c) => c.id === editingColorId ? { id: newId, name: humanName, hex: normalized } : c)
      );
      setSelectedColorIds((prev) =>
        prev.map((id) => id === editingColorId ? newId : id)
      );
    } else {
      // Yeni custom renk ekle
      const customId = `custom:${normalized}`;
      setCustomColors((prev) => {
        if (prev.some((c) => c.id === customId)) return prev;
        return [...prev, { id: customId, name: humanName, hex: normalized }];
      });
      setSelectedColorIds((prev) => (prev.includes(customId) ? prev : [...prev, customId]));
    }

    setEditingColorId(null);
    setWheelVisible(false);
  }, [wheelHex, editingColorId]);

  // Preset renkler için elle atanmış nameTr'a güven (hexToColorName algoritması
  // saf olmayan preset tonlarında yanlış tahmin edebiliyor); custom renklerde
  // (id "custom:" ile başlar) hexToColorName tek isim kaynağı olmaya devam eder.
  const colorLabel = useMemo(() => {
    const labelFor = (c: ColorOption) =>
      c.id.startsWith("custom:") ? hexToColorName(c.hex) : (c.nameTr ?? c.name);
    if (selectedColors.length <= 1) return labelFor(primaryColor);
    if (selectedColors.length === 2 && secondaryColor) {
      return `${labelFor(primaryColor)} + ${labelFor(secondaryColor)}`;
    }
    return "Çok Renkli";
  }, [primaryColor, secondaryColor, selectedColors.length]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current({ colorLabel, colorHex: primaryColor.hex, selectedColorIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorLabel, primaryColor.hex, JSON.stringify(selectedColorIds)]);

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: C.textSecondary }]}>{required ? "Renk *" : "Renk"}</Text>
      <View style={[styles.selectedColorPreviewRow, sizing.selectedColorPreviewRow]}>
        {isRainbow ? (
          <LinearGradient
            colors={RAINBOW_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={sizing.selectedColorDotRainbow}
          />
        ) : (
          <View
            style={[
              sizing.selectedColorDot,
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
      <View style={[styles.colorGrid, sizing.colorGrid]}>
        {availableColors.map((color) => {
          const isSelected = selectedColorIds.includes(color.id);
          const isCustom = color.id.startsWith("custom:");
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
              onLongPress={isCustom ? () => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setColorMenuColorId(color.id);
              } : undefined}
              delayLongPress={400}
              style={[styles.colorItem, sizing.colorItem]}
            >
              <View
                style={[
                  styles.colorDot,
                  sizing.colorDot,
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
              <Text style={[styles.colorLabel, sizing.colorLabel, { color: isSelected ? C.tint : C.textTertiary }]}>
                {isCustom ? hexToColorName(color.hex) : (color.nameTr ?? color.name)}
              </Text>
            </Pressable>
          );
        })}

        {/* Premium: custom color */}
        <Pressable
          onPress={() => {
            // Yeni renk için canlı başlangıç — siyah değil, canlı kırmızı
            const initial = "#E74C3C";
            wheelInitialColorRef.current = initial;
            setWheelHex(initial);
            setWheelPickerKey((k) => k + 1); // picker'ı yeniden mount et
            setWheelVisible(true);
          }}
          style={[styles.colorItem, sizing.colorItem, styles.plusColorItem]}
        >
          <View style={[styles.colorDot, sizing.colorDot, styles.plusColorDot, sizing.plusColorDot, { borderColor: C.tint }]}>
            <Feather name="plus" size={18} color={C.tint} />
          </View>
        </Pressable>
      </View>

      {/* Advanced: color wheel */}
      {wheelVisible && (
        <Modal
          transparent
          animationType="slide"
          visible
          onRequestClose={() => { setEditingColorId(null); setWheelVisible(false); }}
        >
          <View style={styles.wheelModalOverlay}>
            <View style={[styles.wheelModal, { backgroundColor: C.backgroundSecondary }]}>
              <View style={styles.wheelHeader}>
                <View style={styles.wheelTitleRow}>
                  {/* Seçilen rengin canlı önizlemesi */}
                  <View style={[styles.wheelPreviewDot, { backgroundColor: wheelHex }]} />
                  <Text style={[styles.wheelTitle, { color: C.text }]}>
                    {editingColorId ? "Rengi Değiştir" : "Özel Renk"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => { setEditingColorId(null); setWheelVisible(false); }}
                  style={[styles.wheelCloseBtn, { backgroundColor: C.chip }]}
                  hitSlop={10}
                >
                  <Feather name="x" size={18} color={C.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.wheelBody}>
                {/*
                  key={wheelPickerKey}: Her açılışta picker yeniden mount edilir,
                    doğru başlangıç rengiyle başlar.
                  color={wheelInitialColorRef.current}: Stabil ref — state değil.
                    onColorChange → setWheelHex → re-render olduğunda picker
                    bu prop'u değişmiş görmez, thumb pozisyonu sıfırlanmaz.
                */}
                <WheelColorPicker
                  key={wheelPickerKey}
                  color={wheelInitialColorRef.current}
                  onColorChange={handleWheelColorChange}
                  onColorChangeComplete={handleWheelColorChange}
                  thumbSize={38}
                  sliderSize={20}
                />
              </View>
              <Pressable
                onPress={handleConfirmCustomColor}
                style={[styles.wheelConfirmBtn, { backgroundColor: C.tint }]}
              >
                <Feather name="check" size={18} color="#FFF" />
                <Text style={styles.wheelConfirmText}>
                  {editingColorId ? "Güncelle" : "Rengi Ekle"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Custom renk long-press action sheet */}
      {colorMenuColorId && (
        <Modal
          transparent
          animationType="slide"
          visible
          onRequestClose={() => setColorMenuColorId(null)}
        >
          <Pressable
            style={styles.actionSheetOverlay}
            onPress={() => setColorMenuColorId(null)}
          >
            <View style={[styles.actionSheet, { backgroundColor: C.backgroundSecondary }]}>
              <View style={[styles.actionSheetHandle, { backgroundColor: C.separator }]} />

              <Pressable
                style={styles.actionSheetItem}
                onPress={() => {
                  const color = customColors.find((c) => c.id === colorMenuColorId);
                  if (color) {
                    wheelInitialColorRef.current = color.hex;
                    setWheelHex(color.hex);
                    setWheelPickerKey((k) => k + 1);
                    setEditingColorId(colorMenuColorId);
                    setWheelVisible(true);
                  }
                  setColorMenuColorId(null);
                }}
              >
                <Feather name="edit-2" size={20} color={C.text} />
                <Text style={[styles.actionSheetItemText, { color: C.text }]}>Rengi Değiştir</Text>
              </Pressable>

              <View style={[styles.actionSheetDivider, { backgroundColor: C.separator }]} />

              <Pressable
                style={styles.actionSheetItem}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  setCustomColors((prev) => prev.filter((c) => c.id !== colorMenuColorId));
                  setSelectedColorIds((prev) => prev.filter((id) => id !== colorMenuColorId));
                  setColorMenuColorId(null);
                }}
              >
                <Feather name="trash-2" size={20} color={C.destructive} />
                <Text style={[styles.actionSheetItemText, { color: C.destructive }]}>Sil</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 10 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
  selectedColorPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedColorLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  colorGrid: { flexDirection: "row", flexWrap: "wrap" },
  colorItem: { alignItems: "center" },
  colorDot: { alignItems: "center", justifyContent: "center" },
  colorLabel: { fontFamily: "Inter_400Regular", textAlign: "center" },
  plusColorItem: {
    marginLeft: 2,
  },
  plusColorDot: {
    borderWidth: 2,
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
    minHeight: 420,
    gap: 12,
  },
  wheelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  wheelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  wheelPreviewDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
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
  wheelConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  wheelConfirmText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  // Custom color action sheet
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  actionSheetItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  actionSheetItemText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  actionSheetDivider: {
    height: 1,
  },
});

// ─── Boyut varyantları ────────────────────────────────────────────────────────
// "default" = add-item.tsx'in orijinal boyutları, "compact" = item/[id].tsx'in
// orijinal (edit-sheet modalı içinde daha sıkışık) boyutları. Karar: mevcut iki
// görünüm de korunsun, davranış/görünüm hiçbir ekranda değişmesin.
const defaultSizing = StyleSheet.create({
  selectedColorPreviewRow: { marginBottom: 12 },
  selectedColorDot: { width: 28, height: 28, borderRadius: 14 },
  selectedColorDotRainbow: { width: 28, height: 28, borderRadius: 14 },
  colorGrid: { gap: 12 },
  colorItem: { gap: 5, width: 48 },
  colorDot: { width: 40, height: 40, borderRadius: 20 },
  colorLabel: { fontSize: 9 },
  plusColorDot: { borderRadius: 20, width: 40, height: 40 },
});

const compactSizing = StyleSheet.create({
  selectedColorPreviewRow: { marginBottom: 8 },
  selectedColorDot: { width: 24, height: 24, borderRadius: 12 },
  selectedColorDotRainbow: { width: 24, height: 24, borderRadius: 12 },
  colorGrid: { gap: 10 },
  colorItem: { gap: 4, width: 44 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorLabel: { fontSize: 8 },
  plusColorDot: { borderRadius: 20, width: 36, height: 36 },
});
