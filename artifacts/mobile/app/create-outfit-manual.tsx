import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SectionList,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors, { OCCASIONS } from "@/constants/colors";
import { useCloset, Category, Occasion, ClosetItem } from "@/context/ClosetContext";
import { getColorContrastText, SEASON_LABELS } from "@/utils/outfitLogic";

// Categories that allow only ONE item (exclusive slots)
const EXCLUSIVE_CATEGORIES: Category[] = [
  "tops", "bottoms", "dresses", "outerwear", "shoes", "activewear", "sleepwear",
];

const CATEGORY_LABELS: Record<string, string> = {
  tops: "Üst Giyim",
  bottoms: "Alt Giyim",
  dresses: "Elbise / Takım",
  outerwear: "Dış Giyim",
  shoes: "Ayakkabı",
  accessories: "Aksesuar",
  bags: "Çanta",
  activewear: "Spor Giyim",
  sleepwear: "Pijama",
  other: "Diğer",
};

// ─── Selected Item Preview Card ───────────────────────────────────────────────
function SelectedChip({ item, onRemove }: { item: ClosetItem; onRemove: () => void }) {
  const textColor = getColorContrastText(item.colorHex || "#999");
  return (
    <View style={[styles.selectedChip, { backgroundColor: item.colorHex || "#CCC" }]}>
      <View style={styles.selectedChipText}>
        <Text style={[styles.selectedChipCat, { color: textColor, opacity: 0.7 }]} numberOfLines={1}>
          {CATEGORY_LABELS[item.category] ?? item.category}
        </Text>
        <Text style={[styles.selectedChipName, { color: textColor }]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8} style={styles.chipRemoveBtn}>
        <Feather name="x" size={13} color={textColor} style={{ opacity: 0.8 }} />
      </Pressable>
    </View>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────
function ItemRow({
  item,
  isSelected,
  isDisabled,
  onPress,
}: {
  item: ClosetItem;
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
}) {
  const C = Colors.light;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={[
        styles.itemRow,
        {
          backgroundColor: isSelected ? C.tint + "18" : C.card,
          borderColor: isSelected ? C.tint : C.cardBorder,
          opacity: isDisabled ? 0.4 : 1,
        },
      ]}
    >
      <View style={[styles.itemColorDot, { backgroundColor: item.colorHex || "#CCC" }]} />
      <View style={styles.itemRowInfo}>
        <Text style={[styles.itemRowName, { color: C.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.itemRowMeta, { color: C.textTertiary }]}>
          {item.color}
          {item.brand ? ` · ${item.brand}` : ""}
          {(item.seasons ?? []).length > 0
            ? " · " + item.seasons.map((s) => SEASON_LABELS[s]).join(", ")
            : ""}
        </Text>
      </View>
      {isSelected ? (
        <View style={[styles.checkCircle, { backgroundColor: C.tint }]}>
          <Feather name="check" size={13} color="#FFF" />
        </View>
      ) : (
        <View style={[styles.checkCircleEmpty, { borderColor: C.cardBorder }]} />
      )}
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateOutfitManualScreen() {
  const C = Colors.light;
  const { startItemId } = useLocalSearchParams<{ startItemId?: string }>();
  const { items, addOutfit } = useCloset();

  // Initialize with pre-selected item if passed
  const initialSelected: Record<string, ClosetItem> = {};
  if (startItemId) {
    const startItem = items.find((i) => i.id === startItemId);
    if (startItem) initialSelected[startItem.category] = startItem;
  }

  const [selectedByCategory, setSelectedByCategory] = useState<Record<string, ClosetItem>>(initialSelected);
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState<Occasion>("casual");
  const [saving, setSaving] = useState(false);

  const selectedItems = useMemo(() => {
    const accessories =
      items.filter((i) => i.category === "accessories" && selectedAccessoryIds.has(i.id));
    return [...Object.values(selectedByCategory), ...accessories];
  }, [items, selectedByCategory, selectedAccessoryIds]);

  // Group items by category for SectionList
  const sections = useMemo(() => {
    const grouped: Record<string, ClosetItem[]> = {};
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }
    return Object.entries(grouped)
      .map(([cat, data]) => ({ title: cat, label: CATEGORY_LABELS[cat] ?? cat, data }))
      .sort((a, b) => {
        const order = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories", "bags", "activewear", "sleepwear", "other"];
        return (order.indexOf(a.title) ?? 99) - (order.indexOf(b.title) ?? 99);
      });
  }, [items]);

  const handleToggle = useCallback((item: ClosetItem) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();

    if (item.category === "accessories") {
      setSelectedAccessoryIds((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
      });
      return;
    }

    setSelectedByCategory((prev) => {
      const cat = item.category;
      const current = prev[cat];
      if (current?.id === item.id) {
        const next = { ...prev };
        delete next[cat];
        return next;
      }
      if (cat === "dresses") {
        const next = { ...prev };
        delete next.tops;
        delete next.bottoms;
        next[cat] = item;
        return next;
      }
      return { ...prev, [cat]: item };
    });
  }, [setSelectedByCategory, setSelectedAccessoryIds]);

  const handleSave = async () => {
    if (selectedItems.length === 0) return;
    setSaving(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Determine a representative season from selected items
    const allSeasons = selectedItems.flatMap((i) => i.seasons ?? []);
    const seasonCounts: Record<string, number> = {};
    for (const s of allSeasons) seasonCounts[s] = (seasonCounts[s] ?? 0) + 1;
    const topSeason = (Object.entries(seasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "all") as any;

    const resolvedName =
      name.trim().length > 0
        ? name.trim()
        : `Kombin #${new Date().toLocaleDateString("tr-TR")}`;

    await addOutfit({
      name: resolvedName,
      itemIds: selectedItems.map((i) => i.id),
      occasion,
      season: topSeason,
      favorite: false,
    });
    router.replace("/(tabs)/outfits");
  };

  const canSave = selectedItems.length >= 2;

  const ListHeader = useMemo(() => (
    <View style={styles.listHeader}>
      {/* Selected preview */}
      {selectedItems.length > 0 ? (
        <View style={styles.selectedPreview}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>
            Seçilen Parçalar ({selectedItems.length})
          </Text>
          <View style={styles.selectedChips}>
            {selectedItems.map((item) => (
              <SelectedChip
                key={item.id}
                item={item}
                onRemove={() => handleToggle(item)}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={[styles.emptyHint, { backgroundColor: C.chip }]}>
          <Feather name="info" size={16} color={C.textTertiary} />
          <Text style={[styles.emptyHintText, { color: C.textSecondary }]}>
            Aşağıdan parça seçin. Her kategoriden en fazla bir parça ekleyebilirsiniz.
          </Text>
        </View>
      )}

      {/* Name input */}
      <View style={styles.nameRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Kombine bir isim ver..."
          placeholderTextColor={C.textTertiary}
          style={[styles.nameInput, { backgroundColor: C.inputBackground, color: C.text }]}
        />
      </View>

      {/* Occasion */}
      <View style={styles.occasionRow}>
        {OCCASIONS.map((occ) => {
          const isSel = occasion === occ;
          return (
            <Pressable
              key={occ}
              onPress={() => setOccasion(occ as Occasion)}
              style={[styles.occChip, { backgroundColor: isSel ? C.tint : C.chip }]}
            >
              <Text style={[styles.occChipText, { color: isSel ? "#FFF" : C.textSecondary }]}>
                {occ}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.pickerTitle, { color: C.textSecondary }]}>Gardıroptaki Parçalar</Text>
    </View>
  ), [C, selectedItems, name, occasion]);

  return (
    <View style={[styles.container, { backgroundColor: C.backgroundSecondary }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: C.backgroundSecondary }]}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>
              {section.label}
            </Text>
            {selectedByCategory[section.title] && (
              <View style={[styles.sectionSelectedBadge, { backgroundColor: C.tint }]}>
                <Feather name="check" size={11} color="#FFF" />
              </View>
            )}
          </View>
        )}
        renderItem={({ item }) => {
          const cat = item.category as Category;
          const isSelected =
            cat === "accessories"
              ? selectedAccessoryIds.has(item.id)
              : selectedByCategory[cat]?.id === item.id;
          const isExclusive = EXCLUSIVE_CATEGORIES.includes(cat);
          const categoryTaken = !!selectedByCategory[cat] && !isSelected;
          const hasDressSelected = !!selectedByCategory["dresses"];
          const isTopOrBottom = cat === "tops" || cat === "bottoms";
          const isDisabledByDressRule = hasDressSelected && isTopOrBottom;
          const isDisabled = (isExclusive && categoryTaken) || isDisabledByDressRule;

          return (
            <ItemRow
              item={item}
              isSelected={isSelected}
              isDisabled={isDisabled}
              onPress={() => handleToggle(item)}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {/* Save Footer */}
      <View style={[styles.footer, { backgroundColor: C.backgroundSecondary, borderTopColor: C.separator }]}>
        {!canSave && selectedItems.length < 2 && selectedItems.length > 0 && (
          <Text style={[styles.footerHint, { color: C.textTertiary }]}>
            En az 2 parça seçin
          </Text>
        )}
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          style={[styles.saveBtn, { backgroundColor: canSave ? C.tint : C.chip }]}
        >
          <Feather name="bookmark" size={18} color={canSave ? "#FFF" : C.textTertiary} />
          <Text style={[styles.saveBtnText, { color: canSave ? "#FFF" : C.textTertiary }]}>
            {saving ? "Kaydediliyor..." : `Kombini Kaydet (${selectedItems.length} parça)`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { gap: 0 },
  listHeader: { padding: 16, gap: 14, paddingBottom: 8 },

  selectedPreview: { gap: 10 },
  selectedChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 6,
    maxWidth: 180,
  },
  selectedChipText: { flex: 1, gap: 1 },
  selectedChipCat: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  selectedChipName: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  chipRemoveBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  emptyHintText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  nameRow: {},
  nameInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  occasionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  occChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  occChipText: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "capitalize" },

  pickerTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionSelectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  itemColorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    flexShrink: 0,
  },
  itemRowInfo: { flex: 1, gap: 2 },
  itemRowName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemRowMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 16,
    borderTopWidth: 1,
    gap: 8,
  },
  footerHint: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
