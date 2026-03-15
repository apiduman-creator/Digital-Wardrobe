import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors, { CATEGORIES, OCCASIONS, COLOR_PALETTE } from "@/constants/colors";
import { useCloset, Category, Season, Occasion } from "@/context/ClosetContext";
import { getColorContrastText, SEASON_LABELS } from "@/utils/outfitLogic";

const ITEM_SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

const seasonEmoji: Record<Season, string> = {
  spring: "🌸", summer: "☀️", fall: "🍂", winter: "❄️",
};

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
    name: string;
    category: Category;
    color: string;
    colorHex: string;
    seasons: Season[];
    occasion: Occasion;
    brand?: string;
    notes?: string;
  }) => void;
}) {
  const C = Colors.light;
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<Category>(item.category);
  const [colorName, setColorName] = useState(item.color);
  const [colorHex, setColorHex] = useState(item.colorHex);
  const [seasons, setSeasons] = useState<Season[]>(item.seasons ?? []);
  const [occasion, setOccasion] = useState<Occasion>(item.occasion);
  const [brand, setBrand] = useState(item.brand ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");

  const toggleSeason = (s: Season) =>
    setSeasons((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const categoryOptions = CATEGORIES.filter((c) => c.id !== "all");
  const occasionOptions = OCCASIONS;

  const canSave = name.trim().length > 0 && seasons.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.editSheet, { backgroundColor: C.backgroundSecondary }]}>
          {/* Handle + header */}
          <View style={[styles.handle, { backgroundColor: C.separator }]} />
          <View style={styles.editHeader}>
            <Text style={[styles.editTitle, { color: C.text }]}>Ürünü Düzenle</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: C.chip }]}>
              <Feather name="x" size={18} color={C.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editScroll} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Ürün Adı</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={[styles.editInput, { backgroundColor: C.inputBackground, color: C.text }]}
                placeholderTextColor={C.textTertiary}
              />
            </View>

            {/* Brand */}
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Marka</Text>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                placeholder="opsiyonel"
                style={[styles.editInput, { backgroundColor: C.inputBackground, color: C.text }]}
                placeholderTextColor={C.textTertiary}
              />
            </View>

            {/* Category */}
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Kategori</Text>
              <View style={styles.chipWrap}>
                {categoryOptions.map((cat) => {
                  const isSel = category === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategory(cat.id as Category)}
                      style={[styles.chip, { backgroundColor: isSel ? C.tint : C.chip }]}
                    >
                      <Text style={[styles.chipText, { color: isSel ? "#FFF" : C.textSecondary }]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Color */}
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Renk</Text>
              <View style={styles.colorGrid}>
                {COLOR_PALETTE.map((color) => {
                  const isSel = colorName === color.name;
                  return (
                    <Pressable
                      key={color.name}
                      onPress={() => { setColorName(color.name); setColorHex(color.hex); }}
                      style={styles.colorItem}
                    >
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: color.hex },
                          ["White", "Cream"].includes(color.name) ? { borderWidth: 1, borderColor: "#E0DAD2" } : {},
                          isSel ? { borderWidth: 3, borderColor: C.tint } : {},
                        ]}
                      >
                        {isSel && (
                          <Feather name="check" size={12} color={["White", "Cream", "Yellow"].includes(color.name) ? "#1A1A1A" : "#FFF"} />
                        )}
                      </View>
                      <Text style={[styles.colorLabel, { color: isSel ? C.tint : C.textTertiary }]}>
                        {color.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Seasons — multi-select */}
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Mevsim (çoklu seçim)</Text>
              <View style={styles.chipWrap}>
                {ITEM_SEASONS.map((s) => {
                  const isSel = seasons.includes(s);
                  return (
                    <Pressable
                      key={s}
                      onPress={() => toggleSeason(s)}
                      style={[styles.seasonChip, { backgroundColor: isSel ? C.tint : C.chip }]}
                    >
                      <Text style={styles.seasonEmoji}>{seasonEmoji[s]}</Text>
                      <Text style={[styles.chipText, { color: isSel ? "#FFF" : C.textSecondary }]}>
                        {SEASON_LABELS[s]}
                      </Text>
                      {isSel && <Feather name="check" size={12} color="#FFF" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Occasion */}
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Kullanım</Text>
              <View style={styles.chipWrap}>
                {occasionOptions.map((occ) => {
                  const isSel = occasion === occ;
                  return (
                    <Pressable
                      key={occ}
                      onPress={() => setOccasion(occ as Occasion)}
                      style={[styles.chip, { backgroundColor: isSel ? C.tint : C.chip }]}
                    >
                      <Text style={[styles.chipText, { color: isSel ? "#FFF" : C.textSecondary }]}>
                        {occ}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: C.textSecondary }]}>Notlar</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="opsiyonel"
                multiline
                numberOfLines={3}
                style={[styles.editInput, styles.textArea, { backgroundColor: C.inputBackground, color: C.text }]}
                placeholderTextColor={C.textTertiary}
              />
            </View>
          </ScrollView>

          {/* Save */}
          <View style={[styles.editFooter, { borderTopColor: C.separator }]}>
            <Pressable
              onPress={() => {
                if (!canSave) return;
                onSave({ name: name.trim(), category, color: colorName, colorHex, seasons, occasion, brand: brand.trim() || undefined, notes: notes.trim() || undefined });
              }}
              disabled={!canSave}
              style={[styles.saveBtn, { backgroundColor: canSave ? C.tint : C.chip }]}
            >
              <Feather name="check" size={18} color={canSave ? "#FFF" : C.textTertiary} />
              <Text style={[styles.saveBtnText, { color: canSave ? "#FFF" : C.textTertiary }]}>
                Değişiklikleri Kaydet
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  const C = Colors.light;
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: C.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: C.text, textTransform: capitalize ? "capitalize" : "none" }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ItemDetailScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, deleteItem, toggleFavorite, logWear, updateItem } = useCloset();
  const [editVisible, setEditVisible] = useState(false);

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

  const seasonsDisplay = (item.seasons ?? [])
    .map((s) => SEASON_LABELS[s])
    .join(", ") || "—";

  const handleDelete = () => {
    Alert.alert(
      "Ürünü Sil",
      `"${item.name}" gardırobunuzdan silinecek. Bu işlem geri alınamaz.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await deleteItem(item.id);
            router.replace("/(tabs)/");
          },
        },
      ]
    );
  };

  const handleWear = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logWear(item.id);
  };

  const handleFavorite = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(item.id);
  };

  const handleSaveEdit = useCallback(async (updates: {
    name: string; category: Category; color: string; colorHex: string;
    seasons: Season[]; occasion: Occasion; brand?: string; notes?: string;
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
        {/* Color Hero */}
        <View style={[styles.hero, { backgroundColor: item.colorHex || "#CCC" }]}>
          <Text style={[styles.heroCategory, { color: textColor, opacity: 0.7 }]}>
            {item.category.toUpperCase()}
          </Text>
          <Text style={[styles.heroName, { color: textColor }]}>{item.name}</Text>
          {item.brand && (
            <Text style={[styles.heroBrand, { color: textColor, opacity: 0.75 }]}>{item.brand}</Text>
          )}
        </View>

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

          <Pressable onPress={handleDelete} style={styles.actionBtn}>
            <Feather name="trash-2" size={20} color={C.destructive} />
            <Text style={[styles.actionLabel, { color: C.destructive }]}>Sil</Text>
          </Pressable>
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
          <DetailRow label="Renk" value={item.color} />
          <DetailRow label="Kategori" value={item.category} capitalize />
          <DetailRow label="Mevsim" value={seasonsDisplay} />
          <DetailRow label="Kullanım" value={item.occasion} capitalize />
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
  hero: { padding: 32, paddingTop: 48, paddingBottom: 48, gap: 4, alignItems: "center" },
  heroCategory: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  heroName: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: -0.3 },
  heroBrand: { fontSize: 15, fontFamily: "Inter_400Regular" },
  actionsRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 16, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  actionBtn: { flex: 1, alignItems: "center", justifyContent: "center", padding: 12, gap: 4 },
  actionDivider: { width: 1, marginVertical: 12 },
  actionLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  detailCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0EBE4" },
  detailLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  detailValue: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right", flex: 1, marginLeft: 16 },
  statsCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  statsTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 4, flex: 1 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },

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
  editFooter: { borderTopWidth: 1, paddingTop: 16 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, gap: 8 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
