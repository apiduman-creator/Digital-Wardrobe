import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useCloset } from "@/context/ClosetContext";
import { OutfitCard } from "@/components/OutfitCard";
import { EmptyState } from "@/components/EmptyState";

const FILTERS = [
  { label: "Tümü", value: "all" },
  { label: "Günlük", value: "casual" },
  { label: "İş", value: "work" },
  { label: "Resmi", value: "formal" },
  { label: "Spor", value: "sport" },
  { label: "Lounge", value: "lounge" },
  { label: "Özel", value: "special" },
];

export default function OutfitsScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { outfits, items, toggleOutfitFavorite, loading } = useCloset();
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return outfits;
    return outfits.filter((o) => o.occasion === filter);
  }, [outfits, filter]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>Kombin</Text>
            <Text style={[styles.title, { color: C.text }]}>Koleksiyonu</Text>
          </View>
          <Pressable
            onPress={() => router.push("/add-outfit")}
            style={[styles.generateBtn, { backgroundColor: C.text }]}
          >
            <Feather name="shuffle" size={16} color="#FFFFFF" />
            <Text style={styles.generateBtnText}>Kombin Oluştur</Text>
          </Pressable>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
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
                {f.label}
              </Text>
            </Pressable>
          );
        })}
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
          subtitle={
            outfits.length === 0
              ? "Gardırobunuzdaki parçalardan kombin oluşturun."
              : "Farklı bir filtre deneyin."
          }
          actionLabel={outfits.length === 0 ? "İlk Kombini Oluştur" : undefined}
          onAction={outfits.length === 0 ? () => router.push("/add-outfit") : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(outfit) => outfit.id}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={({ item: outfit }) => (
            <OutfitCard
              outfit={outfit}
              items={items}
              onPress={() =>
                router.push({ pathname: "/outfit/[id]", params: { id: outfit.id } })
              }
              onFavoriteToggle={() => toggleOutfitFavorite(outfit.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    marginTop: 8,
  },
  generateBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
