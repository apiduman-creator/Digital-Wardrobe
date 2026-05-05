import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors, { CATEGORIES, OCCASIONS, COLOR_PALETTE } from "@/constants/colors";
import { useCloset, Category, Season, Occasion } from "@/context/ClosetContext";
import { useCalendar } from "@/context/CalendarContext";
import { getColorContrastText, SEASON_LABELS } from "@/utils/outfitLogic";
import { hexToColorName } from "@/utils/colorName";
import { LinearGradient } from "expo-linear-gradient";
import WheelColorPicker from "react-native-wheel-color-picker";

const ITEM_SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

type ItemStatus = "ready" | "dirty" | "washing" | "dry-cleaning";
const STATUS_OPTIONS: { value: ItemStatus; label: string; icon: React.ComponentProps<typeof Feather>["name"]; color: string; bg: string }[] = [
  { value: "ready",        label: "Hazır",            icon: "check-circle", color: "#34C759", bg: "#EDF9F0" },
  { value: "dirty",        label: "Kirlide",           icon: "alert-circle", color: "#FF9500", bg: "#FFF4E5" },
  { value: "washing",      label: "Yıkamada",          icon: "droplet",      color: "#0A84FF", bg: "#E8F2FF" },
  { value: "dry-cleaning", label: "Kuru Temizleme",    icon: "wind",         color: "#8E5AF2", bg: "#F3EDFF" },
];
const seasonEmoji: Record<Season, string> = {
  spring: "🌸", summer: "☀️", fall: "🍂", winter: "❄️",
};

type ColorOption = { id: string; name: string; hex: string };
const BASE_COLORS: ColorOption[] = COLOR_PALETTE.map((c) => ({ id: c.name, name: c.name, hex: c.hex }));
const RAINBOW_GRADIENT = [
  "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#0A84FF", "#5E5CE6", "#BF5AF2", "#FF3B30",
] as const;

// ─── Inline Delete Confirmation ───────────────────────────────────────────────
function DeleteConfirm({
  itemName,
  onCancel,
  onConfirm,
}: {
  itemName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const C = Colors.light;
  return (
    <View style={[styles.deleteBar, { backgroundColor: "#FFF1F1", borderColor: "#FFD0D0" }]}>
      <Feather name="alert-triangle" size={18} color={C.destructive} />
      <Text style={[styles.deleteBarText, { color: C.text }]} numberOfLines={2}>
        <Text style={{ fontFamily: "Inter_600SemiBold" }}>"{itemName}"</Text> silinecek. Geri alınamaz.
      </Text>
      <View style={styles.deleteBarActions}>
        <Pressable onPress={onCancel} style={[styles.deleteBarBtn, { backgroundColor: C.chip }]}>
          <Text style={[styles.deleteBarBtnText, { color: C.textSecondary }]}>İptal</Text>
        </Pressable>
        <Pressable onPress={onConfirm} style={[styles.deleteBarBtn, { backgroundColor: C.destructive }]}>
          <Text style={[styles.deleteBarBtnText, { color: "#FFF" }]}>Sil</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Wore Today Confirmation ──────────────────────────────────────────────────
function WoreToast({ onDismiss }: { onDismiss: () => void }) {
  const C = Colors.light;
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={[styles.toast, { backgroundColor: C.text }]}>
      <Feather name="check-circle" size={16} color={C.tint} />
      <Text style={styles.toastText}>Takvime kaydedildi ✓</Text>
    </View>
  );
}

// ─── Edit Sheet Modal ─────────────────────────────────────────────────────────
function EditSheet({
  visible,
  item,
  onClose,
  onSave,
}: {
  visible: boolean;
  item: ReturnType<typeof useCloset>["items"][number];
  onClose: () => void;
  onSave: (updates: {
    name: string; category: Category; color: string; colorHex: string;
    seasons: Season[]; occasion: string; brand?: string; notes?: string;
  }) => void;
}) {
  const C = Colors.light;
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<Category>(item.category);

  // ── Color system (identical to add-item.tsx) ──────────────────────────────
  // Initialize: match colorHex against base palette; fall back to custom entry
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>(() => {
    const hex = (item.colorHex || "#1A1A1A").toUpperCase();
    const base = BASE_COLORS.find((c) => c.hex.toUpperCase() === hex);
    return base ? [base.id] : [`custom:${hex}`];
  });
  const [customColors, setCustomColors] = useState<ColorOption[]>(() => {
    const hex = (item.colorHex || "#1A1A1A").toUpperCase();
    const base = BASE_COLORS.find((c) => c.hex.toUpperCase() === hex);
    if (base) return [];
    // hexToColorName ile hesapla — item.color "Çok Renkli" gibi bir değer olabilir
    return [{ id: `custom:${hex}`, name: hexToColorName(hex), hex }];
  });
  const [wheelVisible, setWheelVisible] = useState(false);
  const [wheelHex, setWheelHex] = useState("#E74C3C");
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
  const colorLabel = useMemo(() => {
    if (selectedColors.length <= 1) return primaryColor.name;
    if (selectedColors.length === 2) return `${primaryColor.name} + ${secondaryColor?.name}`;
    return "Çok Renkli";
  }, [primaryColor.name, secondaryColor?.name, selectedColors.length]);

  const handleWheelColorChange = useCallback((hex: string) => {
    const normalized = hex.startsWith("#") ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
    setWheelHex(normalized);
  }, []);

  const handleConfirmCustomColor = useCallback(() => {
    const normalized = wheelHex.startsWith("#") ? wheelHex.toUpperCase() : `#${wheelHex.toUpperCase()}`;
    const humanName = hexToColorName(normalized);
    if (editingColorId) {
      const newId = `custom:${normalized}`;
      setCustomColors((prev) => prev.map((c) => c.id === editingColorId ? { id: newId, name: humanName, hex: normalized } : c));
      setSelectedColorIds((prev) => prev.map((id) => id === editingColorId ? newId : id));
    } else {
      const customId = `custom:${normalized}`;
      setCustomColors((prev) => prev.some((c) => c.id === customId) ? prev : [...prev, { id: customId, name: humanName, hex: normalized }]);
      setSelectedColorIds((prev) => prev.includes(customId) ? prev : [...prev, customId]);
    }
    setEditingColorId(null);
    setWheelVisible(false);
  }, [wheelHex, editingColorId]);
  // ─────────────────────────────────────────────────────────────────────────

  const [seasons, setSeasons] = useState<Season[]>(item.seasons ?? []);
  const [occasions, setOccasions] = useState<Occasion[]>(() => {
    try {
      const parsed = JSON.parse(item.occasion);
      if (Array.isArray(parsed)) return parsed as Occasion[];
    } catch {}
    return item.occasion ? [item.occasion as Occasion] : ["casual"];
  });
  const [brand, setBrand] = useState(item.brand ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");

  const toggleSeason = (s: Season) =>
    setSeasons((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleOccasion = (o: Occasion) =>
    setOccasions((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]);

  const categoryOptions = CATEGORIES.filter((c) => c.id !== "all");
  const canSave = name.trim().length > 0 && seasons.length > 0 && occasions.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.editSheet, { backgroundColor: C.backgroundSecondary }]}>
          <View style={[styles.handle, { backgroundColor: C.separator }]} />
          <View style={styles.editHeader}>
            <Text style={[styles.editTitle, { color: C.text }]}>Ürünü Düzenle</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: C.chip }]}>
              <Feather name="x" size={18} color={C.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Ürün Adı</Text>
              <TextInput value={name} onChangeText={setName} style={[styles.editInput, { backgroundColor: C.inputBackground, color: C.text }]} placeholderTextColor={C.textTertiary} />
            </View>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Marka</Text>
              <TextInput value={brand} onChangeText={setBrand} placeholder="opsiyonel" style={[styles.editInput, { backgroundColor: C.inputBackground, color: C.text }]} placeholderTextColor={C.textTertiary} />
            </View>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Kategori</Text>
              <View style={styles.chipWrap}>
                {categoryOptions.map((cat) => {
                  const isSel = category === cat.id;
                  return (
                    <Pressable key={cat.id} onPress={() => setCategory(cat.id as Category)}
                      style={[styles.chip, { backgroundColor: isSel ? C.tint : C.chip }]}>
                      <Text style={[styles.chipText, { color: isSel ? "#FFF" : C.textSecondary }]}>{cat.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Renk</Text>
              {/* Preview */}
              <View style={styles.selectedColorPreviewRow}>
                {isRainbow ? (
                  <LinearGradient colors={RAINBOW_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.selectedColorDotRainbow} />
                ) : (
                  <View style={[styles.selectedColorDot, {
                    backgroundColor: selectedColors.length === 0 ? "#E0E0E0" : primaryColor.hex,
                    borderColor: selectedColors.length === 2 && secondaryColor ? secondaryColor.hex : "transparent",
                    borderWidth: selectedColors.length === 2 ? 3 : 0,
                  }]} />
                )}
                <Text style={[styles.selectedColorLabel, { color: C.textSecondary }]}>{colorLabel}</Text>
              </View>
              {/* Grid */}
              <View style={styles.colorGrid}>
                {availableColors.map((color) => {
                  const isSelected = selectedColorIds.includes(color.id);
                  const isCustom = color.id.startsWith("custom:");
                  return (
                    <Pressable
                      key={color.id}
                      onPress={() => setSelectedColorIds((prev) =>
                        prev.includes(color.id) ? prev.filter((n) => n !== color.id) : [...prev, color.id]
                      )}
                      onLongPress={isCustom ? () => {
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setColorMenuColorId(color.id);
                      } : undefined}
                      delayLongPress={400}
                      style={styles.colorItem}
                    >
                      <View style={[
                        styles.colorDot,
                        { backgroundColor: color.hex },
                        ["White", "Cream"].includes(color.name) ? { borderWidth: 1, borderColor: "#E0DAD2" } : {},
                        isSelected ? { borderWidth: 3, borderColor: C.tint } : {},
                      ]}>
                        {isSelected && (
                          <Feather name="check" size={12} color={["White", "Cream", "Yellow"].includes(color.name) ? "#1A1A1A" : "#FFF"} />
                        )}
                      </View>
                      <Text style={[styles.colorLabel, { color: isSelected ? C.tint : C.textTertiary }]}>{color.name}</Text>
                    </Pressable>
                  );
                })}
                {/* Custom color + button */}
                <Pressable
                  onPress={() => {
                    const initial = "#E74C3C";
                    wheelInitialColorRef.current = initial;
                    setWheelHex(initial);
                    setWheelPickerKey((k) => k + 1);
                    setWheelVisible(true);
                  }}
                  style={[styles.colorItem, styles.plusColorItem]}
                >
                  <View style={[styles.colorDot, styles.plusColorDot, { borderColor: C.tint }]}>
                    <Feather name="plus" size={18} color={C.tint} />
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Mevsim (çoklu)</Text>
              <View style={styles.chipWrap}>
                {ITEM_SEASONS.map((s) => {
                  const isSel = seasons.includes(s);
                  return (
                    <Pressable key={s} onPress={() => toggleSeason(s)}
                      style={[styles.seasonChip, { backgroundColor: isSel ? C.tint : C.chip }]}>
                      <Text style={styles.seasonEmoji}>{seasonEmoji[s]}</Text>
                      <Text style={[styles.chipText, { color: isSel ? "#FFF" : C.textSecondary }]}>{SEASON_LABELS[s]}</Text>
                      {isSel && <Feather name="check" size={12} color="#FFF" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Kullanım (çoklu)</Text>
              <View style={styles.chipWrap}>
                {OCCASIONS.map((occ) => {
                  const isSel = occasions.includes(occ as Occasion);
                  return (
                    <Pressable key={occ} onPress={() => toggleOccasion(occ as Occasion)}
                      style={[styles.chip, { backgroundColor: isSel ? C.tint : C.chip, flexDirection: "row", alignItems: "center", gap: 5 }]}>
                      {isSel && <Feather name="check" size={12} color="#FFF" />}
                      <Text style={[styles.chipText, { color: isSel ? "#FFF" : C.textSecondary }]}>{occ}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Notlar</Text>
              <TextInput value={notes} onChangeText={setNotes} placeholder="opsiyonel" multiline numberOfLines={3}
                style={[styles.editInput, styles.textArea, { backgroundColor: C.inputBackground, color: C.text }]}
                placeholderTextColor={C.textTertiary} />
            </View>
          </ScrollView>

          <View style={[styles.editFooter, { borderTopColor: C.separator }]}>
            <Pressable onPress={() => { if (!canSave) return; onSave({ name: name.trim(), category, color: colorLabel, colorHex: primaryColor.hex, seasons, occasion: JSON.stringify(occasions), brand: brand.trim() || undefined, notes: notes.trim() || undefined }); }}
              disabled={!canSave}
              style={[styles.saveBtn, { backgroundColor: canSave ? C.tint : C.chip }]}>
              <Feather name="check" size={18} color={canSave ? "#FFF" : C.textTertiary} />
              <Text style={[styles.saveBtnText, { color: canSave ? "#FFF" : C.textTertiary }]}>Değişiklikleri Kaydet</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Wheel color picker — ana Modal'ın içinde olmalı, yoksa iOS'ta görünmez */}
      {wheelVisible && (
        <Modal transparent animationType="slide" visible onRequestClose={() => { setEditingColorId(null); setWheelVisible(false); }}>
          <View style={styles.wheelModalOverlay}>
            <View style={[styles.wheelModal, { backgroundColor: C.backgroundSecondary }]}>
              <View style={styles.wheelHeader}>
                <View style={styles.wheelTitleRow}>
                  <View style={[styles.wheelPreviewDot, { backgroundColor: wheelHex }]} />
                  <Text style={[styles.wheelTitle, { color: C.text }]}>{editingColorId ? "Rengi Değiştir" : "Özel Renk"}</Text>
                </View>
                <Pressable onPress={() => { setEditingColorId(null); setWheelVisible(false); }} style={[styles.wheelCloseBtn, { backgroundColor: C.chip }]} hitSlop={10}>
                  <Feather name="x" size={18} color={C.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.wheelBody}>
                <WheelColorPicker
                  key={wheelPickerKey}
                  color={wheelInitialColorRef.current}
                  onColorChange={handleWheelColorChange}
                  onColorChangeComplete={handleWheelColorChange}
                  thumbSize={38}
                  sliderSize={20}
                />
              </View>
              <Pressable onPress={handleConfirmCustomColor} style={[styles.wheelConfirmBtn, { backgroundColor: C.tint }]}>
                <Feather name="check" size={18} color="#FFF" />
                <Text style={styles.wheelConfirmText}>{editingColorId ? "Güncelle" : "Rengi Ekle"}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Action sheet — ana Modal'ın içinde olmalı */}
      {colorMenuColorId && (
        <Modal transparent animationType="slide" visible onRequestClose={() => setColorMenuColorId(null)}>
          <Pressable style={styles.actionSheetOverlay} onPress={() => setColorMenuColorId(null)}>
            <View style={[styles.actionSheet, { backgroundColor: C.backgroundSecondary }]}>
              <View style={[styles.actionSheetHandle, { backgroundColor: C.separator }]} />
              <Pressable style={styles.actionSheetItem} onPress={() => {
                const color = customColors.find((c) => c.id === colorMenuColorId);
                if (color) {
                  wheelInitialColorRef.current = color.hex;
                  setWheelHex(color.hex);
                  setWheelPickerKey((k) => k + 1);
                  setEditingColorId(colorMenuColorId);
                  setWheelVisible(true);
                }
                setColorMenuColorId(null);
              }}>
                <Feather name="edit-2" size={20} color={C.text} />
                <Text style={[styles.actionSheetItemText, { color: C.text }]}>Rengi Değiştir</Text>
              </Pressable>
              <View style={[styles.actionSheetDivider, { backgroundColor: C.separator }]} />
              <Pressable style={styles.actionSheetItem} onPress={() => {
                if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                setCustomColors((prev) => prev.filter((c) => c.id !== colorMenuColorId));
                setSelectedColorIds((prev) => prev.filter((id) => id !== colorMenuColorId));
                setColorMenuColorId(null);
              }}>
                <Feather name="trash-2" size={20} color={C.destructive} />
                <Text style={[styles.actionSheetItemText, { color: C.destructive }]}>Sil</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </Modal>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  const C = Colors.light;
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: C.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: C.text, textTransform: capitalize ? "capitalize" : "none" }]}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ItemDetailScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, deleteItem, toggleFavorite, logWear, updateItem } = useCloset();
  const { logWornItem } = useCalendar();

  const [editVisible, setEditVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showWoreToast, setShowWoreToast] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const item = items.find((i) => i.id === id);

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <Text style={{ color: C.textSecondary, textAlign: "center", marginTop: 80 }}>
          Ürün bulunamadı.
        </Text>
      </View>
    );
  }

  const textColor = getColorContrastText(item.colorHex || "#999");
  const seasonsDisplay = (item.seasons ?? []).map((s) => SEASON_LABELS[s]).join(", ") || "—";

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await deleteItem(item.id);
    router.replace("/");
  };

  const handleWear = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 1. Update wear count + lastWorn on the item
    await logWear(item.id);
    // 2. Log to calendar for today — merges into existing entry
    await logWornItem(item.id, item.name);
    setShowWoreToast(true);
  };

  const handleFavorite = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(item.id);
  };

  const handleSaveEdit = useCallback(async (updates: {
    name: string; category: Category; color: string; colorHex: string;
    seasons: Season[]; occasion: string; brand?: string; notes?: string;
  }) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateItem(item.id, updates);
    setEditVisible(false);
  }, [item.id, updateItem]);

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: C.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Color Hero / Photo */}
        <View style={[styles.hero, { backgroundColor: item.colorHex || "#CCC" }]}>
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}
          <View style={item.imageUri ? styles.heroOverlay : undefined}>
            <Text style={[styles.heroCategory, { color: textColor, opacity: item.imageUri ? 1 : 0.7 }]}>
              {item.category.toUpperCase()}
            </Text>
            <Text style={[styles.heroName, { color: textColor }]}>{item.name}</Text>
            {item.brand && (
              <Text style={[styles.heroBrand, { color: textColor, opacity: item.imageUri ? 1 : 0.75 }]}>{item.brand}</Text>
            )}
          </View>
        </View>

        {/* Inline Delete Confirmation */}
        {confirmDelete && (
          <DeleteConfirm
            itemName={item.name}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={handleDelete}
          />
        )}

        {/* Action Buttons */}
        <View style={[styles.actionsRow, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
          <Pressable onPress={handleFavorite} style={styles.actionBtn}>
            <Feather name="heart" size={20} color={item.favorite ? "#E05252" : C.textSecondary} />
            <Text style={[styles.actionLabel, { color: item.favorite ? "#E05252" : C.textSecondary }]}>
              {item.favorite ? "Favori" : "Favori Ekle"}
            </Text>
          </Pressable>

          <View style={[styles.actionDivider, { backgroundColor: C.separator }]} />

          <Pressable onPress={handleWear} style={styles.actionBtn}>
            <Feather name="check-circle" size={20} color={C.tint} />
            <Text style={[styles.actionLabel, { color: C.tint }]}>Bugün Giydim</Text>
          </Pressable>

          <View style={[styles.actionDivider, { backgroundColor: C.separator }]} />

          <Pressable onPress={() => setEditVisible(true)} style={styles.actionBtn}>
            <Feather name="edit-2" size={20} color={C.text} />
            <Text style={[styles.actionLabel, { color: C.text }]}>Düzenle</Text>
          </Pressable>

          <View style={[styles.actionDivider, { backgroundColor: C.separator }]} />

          <Pressable
            onPress={() => { setConfirmDelete(true); }}
            style={styles.actionBtn}
          >
            <Feather name="trash-2" size={20} color={C.destructive} />
            <Text style={[styles.actionLabel, { color: C.destructive }]}>Sil</Text>
          </Pressable>
        </View>

        {/* Durum Seçici */}
        <View style={[styles.statusCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
          <Text style={[styles.statusTitle, { color: C.textSecondary }]}>DURUM</Text>
          <View style={styles.statusGrid}>
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = (item.status ?? "ready") === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => updateItem(item.id, { status: opt.value })}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor: isSelected ? opt.bg : C.chip,
                      borderColor: isSelected ? opt.color : "transparent",
                    },
                  ]}
                >
                  <Feather name={opt.icon} size={16} color={isSelected ? opt.color : C.textTertiary} />
                  <Text style={[
                    styles.statusOptionLabel,
                    { color: isSelected ? opt.color : C.textSecondary,
                      fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular" },
                  ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Create Outfit From This Item */}
        <Pressable
          onPress={() => router.push({ pathname: "/create-outfit-manual", params: { startItemId: item.id } })}
          style={[styles.createOutfitBtn, { backgroundColor: C.chip, borderColor: C.cardBorder }]}
        >
          <Feather name="layers" size={18} color={C.tint} />
          <View style={styles.createOutfitBtnText}>
            <Text style={[styles.createOutfitBtnTitle, { color: C.text }]}>Bu Ürünle Kombin Kur</Text>
            <Text style={[styles.createOutfitBtnSub, { color: C.textSecondary }]}>
              Bu parçayla başlayarak manuel kombin oluştur
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={C.textTertiary} />
        </Pressable>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
          <DetailRow label="Renk" value={item.color} />
          <DetailRow label="Kategori" value={item.category} capitalize />
          <DetailRow label="Mevsim" value={seasonsDisplay} />
          <DetailRow label="Kullanım" value={(() => { try { const p = JSON.parse(item.occasion); return Array.isArray(p) ? p.join(", ") : item.occasion; } catch { return item.occasion; } })()} capitalize />
          {item.brand && <DetailRow label="Marka" value={item.brand} />}
          {item.notes && <DetailRow label="Notlar" value={item.notes} />}
        </View>

        {/* Wear Stats */}
        <View style={[styles.statsCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
          <Text style={[styles.statsTitle, { color: C.textSecondary }]}>İstatistikler</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: C.tint }]}>{item.wearCount}</Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Kez Giyildi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: C.text, fontSize: 13 }]}>
                {formatDate(item.lastWorn ?? undefined)}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Son Giyim</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: C.text, fontSize: 13 }]}>
                {formatDate(item.createdAt)}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Eklendi</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Toast */}
      {showWoreToast && <WoreToast onDismiss={() => setShowWoreToast(false)} />}

      {/* Edit Modal */}
      {editVisible && (
        <EditSheet
          visible={editVisible}
          item={item}
          onClose={() => setEditVisible(false)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { padding: 32, paddingTop: 48, paddingBottom: 48, gap: 4, alignItems: "center", overflow: "hidden" },
  heroOverlay: { padding: 16, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", gap: 4 },
  heroCategory: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  heroName: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: -0.3 },
  heroBrand: { fontSize: 15, fontFamily: "Inter_400Regular" },

  // Inline delete bar
  deleteBar: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteBarText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  deleteBarActions: { flexDirection: "row", gap: 8 },
  deleteBarBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  deleteBarBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  actionsRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 16, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  actionBtn: { flex: 1, alignItems: "center", justifyContent: "center", padding: 12, gap: 4 },
  actionDivider: { width: 1, marginVertical: 12 },
  actionLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },

  createOutfitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  createOutfitBtnText: { flex: 1, gap: 2 },
  createOutfitBtnTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  createOutfitBtnSub: { fontSize: 11, fontFamily: "Inter_400Regular" },

  detailCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0EBE4" },
  detailLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  detailValue: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right", flex: 1, marginLeft: 16 },

  statusCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  statusTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusOption: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  statusOptionLabel: { fontSize: 13 },
  statsCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  statsTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 4, flex: 1 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },

  // Toast
  toast: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  toastText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // Edit modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  editSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", paddingHorizontal: 20, paddingBottom: Platform.OS === "ios" ? 36 : 20 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  editHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  editTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  editScroll: { gap: 20, paddingBottom: 20 },
  editField: { gap: 10 },
  editLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
  editInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  textArea: { height: 80, textAlignVertical: "top", paddingTop: 12 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  chipText: { fontSize: 12, textTransform: "capitalize", fontFamily: "Inter_500Medium" },
  seasonChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 5 },
  seasonEmoji: { fontSize: 14 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorItem: { alignItems: "center", gap: 4, width: 44 },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  colorLabel: { fontSize: 8, fontFamily: "Inter_400Regular", textAlign: "center" },
  selectedColorPreviewRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  selectedColorDot: { width: 24, height: 24, borderRadius: 12 },
  selectedColorDotRainbow: { width: 24, height: 24, borderRadius: 12 },
  selectedColorLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  plusColorItem: { marginLeft: 2 },
  plusColorDot: { borderWidth: 2, borderRadius: 20, width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  // Wheel modal
  wheelModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  wheelModal: { padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: 420, gap: 12 },
  wheelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  wheelTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  wheelPreviewDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  wheelTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  wheelCloseBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  wheelBody: { flex: 1, alignItems: "center", justifyContent: "center" },
  wheelConfirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  wheelConfirmText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  // Action sheet
  actionSheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  actionSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === "ios" ? 36 : 20, paddingHorizontal: 16, paddingTop: 12 },
  actionSheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  actionSheetItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, paddingHorizontal: 4 },
  actionSheetItemText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  actionSheetDivider: { height: 1 },
  editFooter: { borderTopWidth: 1, paddingTop: 16 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, gap: 8 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
