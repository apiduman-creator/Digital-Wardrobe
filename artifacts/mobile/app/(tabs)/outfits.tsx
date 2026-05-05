import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useCloset } from "@/context/ClosetContext";

const P = {
  bg:         "#F9F3EA",
  ink:        "#2C1A0E",
  inkLight:   "#A88B75",
  accent:     "#C84B4B",
  accentGold: "#C9A96E",
  border:     "#DDD0BC",
  tagBg:      "#F5EBD8",
  white:      "#FFFFFF",
};
import { OutfitCard } from "@/components/OutfitCard";
import { EmptyState } from "@/components/EmptyState";

const FILTERS = [
  { label: "Tümü", value: "all" },
  { label: "Günlük", value: "casual" },
  { label: "İş", value: "work" },
  { label: "Resmi", value: "formal" },
  { label: "Spor", value: "sport" },
  { label: "Ev", value: "lounge" },
  { label: "Özel", value: "special" },
];

// Görünür tab bar yüksekliği (safe area hariç)
const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 49;
// Aksiyon barının kendi yüksekliği (padding dahil)
const ACTION_BAR_HEIGHT = 68;

export default function OutfitsScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { outfits, items, toggleOutfitFavorite, deleteOutfit, loading } = useCloset();
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return outfits;
    return outfits.filter((o) => o.occasion === filter);
  }, [outfits, filter]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Aksiyon barının alt konumu: safe area + tab bar yüksekliği + küçük boşluk
  const actionBarBottom =
    Platform.OS === "web"
      ? TAB_BAR_HEIGHT + 8
      : insets.bottom + TAB_BAR_HEIGHT + 8;

  // Liste içeriğinin alt padding'i: tab bar + aksiyon bar + hava payı
  const listPaddingBottom =
    Platform.OS === "web"
      ? TAB_BAR_HEIGHT + ACTION_BAR_HEIGHT + 24
      : insets.bottom + TAB_BAR_HEIGHT + ACTION_BAR_HEIGHT + 24;

  return (
    <View style={[styles.container, { backgroundColor: P.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 2,
            backgroundColor: P.bg,
            zIndex: 2,
            borderBottomWidth: 1,
            borderBottomColor: P.border,
          },
        ]}
      >
        <Text style={styles.subtitle}>Kombin</Text>
        <Text style={styles.title}>Koleksiyonu</Text>

        {/* Filtreler — header içinde, yatay kaydırılabilir */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const isSelected = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? C.tint : C.chip,
                    borderColor: isSelected ? C.tint : "transparent",
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: isSelected ? "#FFF" : C.textSecondary, fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_500Medium" }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.tint} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="layers"
          title={outfits.length === 0 ? "Henüz kombin yok" : "Eşleşme yok"}
          subtitle={outfits.length === 0 ? "Gardırobunuzdaki parçalardan kombin oluşturun." : "Farklı bir filtre deneyin."}
          actionLabel={outfits.length === 0 ? "İlk Kombini Oluştur" : undefined}
          onAction={outfits.length === 0 ? () => router.push("/add-outfit") : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(outfit) => outfit.id}
          contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={({ item: outfit }) => (
            <OutfitCard
              outfit={outfit}
              items={items}
              onPress={() => router.push({ pathname: "/outfit/[id]", params: { id: outfit.id } })}
              onFavoriteToggle={() => toggleOutfitFavorite(outfit.id)}
              onDelete={() => deleteOutfit(outfit.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* Sabit aksiyon barı — tab bar'ın hemen üstünde, home indicator'ın üstünde */}
      <View
        style={[
          styles.actionBar,
          {
            bottom: actionBarBottom,
            backgroundColor: C.backgroundSecondary,
            borderColor: C.separator,
          },
        ]}
      >
        <Pressable
          onPress={() => router.push("/create-outfit-manual")}
          style={[styles.actionBarBtnSecondary, { backgroundColor: C.chip, borderColor: C.cardBorder }]}
        >
          <Feather name="plus" size={16} color={C.text} />
          <Text style={[styles.actionBarBtnText, { color: C.text }]}>Manuel</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/add-outfit")}
          style={[styles.actionBarBtnPrimary, { backgroundColor: C.text }]}
        >
          <Feather name="shuffle" size={16} color="#FFFFFF" />
          <Text style={[styles.actionBarBtnText, { color: "#FFFFFF" }]}>Rastgele</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, overflow: "visible" },
  subtitle: { fontSize: 12, fontFamily: "Inter_500Medium", color: P.inkLight, letterSpacing: 3, textTransform: "uppercase" },
  title: { fontSize: 38, fontFamily: "PlayfairDisplay_700Bold", color: P.ink, letterSpacing: -1 },
  filterRow: { paddingHorizontal: 16, gap: 8, flexDirection: "row", alignItems: "center", paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, textTransform: "capitalize" },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Sabit aksiyon barı
  actionBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    // Hafif gölge (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBarBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBarBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBarBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
