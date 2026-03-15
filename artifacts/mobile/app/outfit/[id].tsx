import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useCloset } from "@/context/ClosetContext";
import { getColorContrastText } from "@/utils/outfitLogic";

export default function OutfitDetailScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { outfits, items, deleteOutfit, toggleOutfitFavorite } = useCloset();

  const outfit = outfits.find((o) => o.id === id);

  if (!outfit) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <Text style={{ color: C.textSecondary, textAlign: "center", marginTop: 80 }}>
          Kombin bulunamadı.
        </Text>
      </View>
    );
  }

  const outfitItems = outfit.itemIds
    .map((oid) => items.find((i) => i.id === oid))
    .filter(Boolean) as typeof items;

  const handleDelete = () => {
    Alert.alert("Kombini Sil", `"${outfit.name}" silinecek. Emin misiniz?`, [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await deleteOutfit(outfit.id);
          router.back();
        },
      },
    ]);
  };

  const handleFavorite = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleOutfitFavorite(outfit.id);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Color Strip Header */}
      <View style={styles.colorStrip}>
        {outfitItems.length > 0
          ? outfitItems.map((item) => (
              <View key={item.id} style={[styles.colorBar, { backgroundColor: item.colorHex || "#CCC" }]} />
            ))
          : <View style={[styles.colorBar, { flex: 1, backgroundColor: C.chip }]} />}
      </View>

      {/* Title & Actions */}
      <View style={styles.heroSection}>
        <View style={styles.heroText}>
          <Text style={[styles.heroTitle, { color: C.text }]}>{outfit.name}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: C.chip }]}>
              <Text style={[styles.badgeText, { color: C.textSecondary }]}>{outfit.occasion}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: C.chip }]}>
              <Text style={[styles.badgeText, { color: C.textSecondary }]}>{outfit.season}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={handleFavorite}
            style={[styles.iconBtn, { backgroundColor: C.chip }]}
          >
            <Feather
              name="heart"
              size={20}
              color={outfit.favorite ? "#E05252" : C.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={[styles.iconBtn, { backgroundColor: C.chip }]}
          >
            <Feather name="trash-2" size={20} color={C.destructive} />
          </Pressable>
        </View>
      </View>

      {/* Pieces */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>
          Parçalar ({outfitItems.length})
        </Text>
        {outfitItems.length === 0 ? (
          <Text style={[styles.emptyText, { color: C.textTertiary }]}>
            Bu kombinateki ürünler silinmiş.
          </Text>
        ) : (
          <View style={styles.piecesGrid}>
            {outfitItems.map((item) => {
              const textColor = getColorContrastText(item.colorHex || "#999");
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
                  style={[styles.pieceCard, { backgroundColor: item.colorHex || "#CCC" }]}
                >
                  <Text style={[styles.pieceCat, { color: textColor, opacity: 0.7 }]}>
                    {item.category.toUpperCase()}
                  </Text>
                  <Text style={[styles.pieceName, { color: textColor }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.brand && (
                    <Text style={[styles.pieceBrand, { color: textColor, opacity: 0.65 }]}>
                      {item.brand}
                    </Text>
                  )}
                  <View style={styles.chevronWrap}>
                    <Feather name="chevron-right" size={14} color={textColor} style={{ opacity: 0.6 }} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Notes */}
      {outfit.notes && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Notlar</Text>
          <View style={[styles.notesCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
            <Text style={[styles.notesText, { color: C.text }]}>{outfit.notes}</Text>
          </View>
        </View>
      )}

      {/* Dates */}
      <View style={[styles.dateCard, { backgroundColor: C.card, borderColor: C.cardBorder, marginHorizontal: 16 }]}>
        <Text style={[styles.dateLabel, { color: C.textSecondary }]}>Oluşturulma</Text>
        <Text style={[styles.dateValue, { color: C.text }]}>{formatDate(outfit.createdAt)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  colorStrip: {
    height: 14,
    flexDirection: "row",
  },
  colorBar: {
    flex: 1,
  },
  heroSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 8,
  },
  heroText: {
    flex: 1,
    gap: 8,
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 20,
  },
  piecesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pieceCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    gap: 3,
    minHeight: 90,
    justifyContent: "center",
    position: "relative",
  },
  pieceCat: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  pieceName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  pieceBrand: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  chevronWrap: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  notesCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  dateCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
  },
  dateLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  dateValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
