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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import Colors, { SEASONS, OCCASIONS } from "@/constants/colors";
import { useCloset, OutfitSeason, Occasion, ClosetItem } from "@/context/ClosetContext";
import { generateRandomOutfit, GeneratedOutfit, suggestOutfitName } from "@/utils/outfitLogic";
import { getColorContrastText } from "@/utils/outfitLogic";

// ─── Outfit Piece Card ────────────────────────────────────────────────────────
function PieceCard({ item, role }: { item: ClosetItem | null; role: string }) {
  const C = Colors.light;
  if (!item) {
    return (
      <View style={[styles.pieceCard, styles.pieceEmpty, { borderColor: C.cardBorder }]}>
        <Feather name="minus" size={16} color={C.textTertiary} />
        <Text style={[styles.pieceMissing, { color: C.textTertiary }]}>{role} yok</Text>
      </View>
    );
  }
  const textColor = getColorContrastText(item.colorHex || "#999");
  return (
    <View style={[styles.pieceCard, { backgroundColor: item.colorHex || "#CCC", borderColor: "transparent" }]}>
      <Text style={[styles.pieceRole, { color: textColor, opacity: 0.7 }]}>{role.toUpperCase()}</Text>
      <Text style={[styles.pieceName, { color: textColor }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.pieceColor, { color: textColor, opacity: 0.7 }]}>{item.color}</Text>
    </View>
  );
}

// ─── Chip Selector ────────────────────────────────────────────────────────────
function ChipRow({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const C = Colors.light;
  return (
    <View style={styles.chipWrap}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.chip,
              { backgroundColor: isSelected ? C.tint : C.chip },
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
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddOutfitScreen() {
  const C = Colors.light;
  const { items, addOutfit } = useCloset();

  const [generated, setGenerated] = useState<GeneratedOutfit | null>(null);
  const [name, setName] = useState("");
  const [season, setSeason] = useState<OutfitSeason>("all");
  const [occasion, setOccasion] = useState<Occasion>("casual");
  const [saving, setSaving] = useState(false);

  const spinValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handleGenerate = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    scaleValue.value = withSpring(0.95, { damping: 15 }, () => {
      scaleValue.value = withSpring(1, { damping: 15 });
    });

    const outfit = generateRandomOutfit(items, season, occasion);
    setGenerated(outfit);
    setName(suggestOutfitName(outfit));
  }, [items, season, occasion]);

  const handleSave = async () => {
    if (!generated) return;
    if (!name.trim()) {
      Alert.alert("Hata", "Lütfen kombin için bir isim girin.");
      return;
    }

    const allItems = [generated.top, generated.bottom, generated.outerwear, generated.shoes].filter(
      Boolean
    ) as ClosetItem[];

    if (allItems.length === 0) {
      Alert.alert("Hata", "Kombin en az bir parça içermelidir.");
      return;
    }

    setSaving(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addOutfit({
      name: name.trim(),
      itemIds: allItems.map((i) => i.id),
      occasion,
      season,
      favorite: false,
    });
    router.back();
  };

  const seasonOptions = SEASONS.map((s) => ({
    label: s === "all" ? "Tüm Mevsimler" : s.charAt(0).toUpperCase() + s.slice(1),
    value: s,
  }));

  const occasionOptions = OCCASIONS.map((o) => ({
    label: o.charAt(0).toUpperCase() + o.slice(1),
    value: o,
  }));

  const hasEnoughItems = items.length >= 2;

  return (
    <View style={[styles.container, { backgroundColor: C.backgroundSecondary }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Filter Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Mevsim</Text>
          <ChipRow
            options={seasonOptions}
            selected={season}
            onSelect={(v) => setSeason(v as OutfitSeason)}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Kullanım</Text>
          <ChipRow
            options={occasionOptions}
            selected={occasion}
            onSelect={(v) => setOccasion(v as Occasion)}
          />
        </View>

        {/* Generate Button */}
        {!hasEnoughItems ? (
          <View style={[styles.emptyNotice, { backgroundColor: C.chip, borderColor: C.cardBorder }]}>
            <Feather name="info" size={20} color={C.textTertiary} />
            <Text style={[styles.emptyNoticeText, { color: C.textSecondary }]}>
              Kombin oluşturmak için gardırobunuza en az 2 ürün ekleyin.
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={handleGenerate}
            style={[styles.generateBtn, { backgroundColor: C.text }]}
          >
            <Feather name="shuffle" size={20} color="#FFFFFF" />
            <Text style={styles.generateBtnText}>
              {generated ? "Yeniden Oluştur" : "Kombin Oluştur"}
            </Text>
          </Pressable>
        )}

        {/* Generated Outfit Preview */}
        {generated && (
          <Animated.View style={[animStyle, styles.previewSection]}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Oluşturulan Kombin</Text>

            <View style={styles.piecesGrid}>
              {generated.top && <PieceCard item={generated.top} role="Üst" />}
              {generated.bottom && <PieceCard item={generated.bottom} role="Alt" />}
              {generated.outerwear && <PieceCard item={generated.outerwear} role="Dış Giyim" />}
              {generated.shoes && <PieceCard item={generated.shoes} role="Ayakkabı" />}
            </View>

            {/* Name Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Kombin Adı</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Bu kombine bir isim verin..."
                placeholderTextColor={C.textTertiary}
                style={[styles.input, { backgroundColor: C.inputBackground, color: C.text }]}
              />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Save Button */}
      {generated && (
        <View style={[styles.footer, { backgroundColor: C.backgroundSecondary, borderTopColor: C.separator }]}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, { backgroundColor: C.tint }]}
          >
            <Feather name="bookmark" size={18} color="#FFF" />
            <Text style={styles.saveBtnText}>
              {saving ? "Kaydediliyor..." : "Kombini Kaydet"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: 20,
    paddingBottom: 120,
    gap: 24,
  },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
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
  },
  chipText: {
    fontSize: 13,
    textTransform: "capitalize",
  },
  emptyNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyNoticeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  generateBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  previewSection: {
    gap: 16,
  },
  piecesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pieceCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    minHeight: 90,
    justifyContent: "center",
  },
  pieceEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pieceRole: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  pieceName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  pieceColor: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  pieceMissing: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
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
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
