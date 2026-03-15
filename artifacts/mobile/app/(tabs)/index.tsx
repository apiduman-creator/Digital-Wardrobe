import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useCloset } from "@/context/ClosetContext";
import { ClothingCard } from "@/components/ClothingCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EmptyState } from "@/components/EmptyState";

export default function ClosetScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { items, toggleFavorite, loading } = useCloset();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = category === "all" || item.category === category;
      const matchSearch =
        search.trim() === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(search.toLowerCase())) ||
        item.color.toLowerCase().includes(search.toLowerCase());
      const matchFav = !showFavoritesOnly || item.favorite;
      return matchCategory && matchSearch && matchFav;
    });
  }, [items, category, search, showFavoritesOnly]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>Dijital</Text>
            <Text style={[styles.title, { color: C.text }]}>Gardırop</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowFavoritesOnly((prev) => !prev)}
              style={[
                styles.iconBtn,
                showFavoritesOnly ? { backgroundColor: "#FFE8E8" } : {},
              ]}
            >
              <Feather
                name="heart"
                size={20}
                color={showFavoritesOnly ? "#E05252" : C.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => router.push("/add-item")}
              style={[styles.addBtn, { backgroundColor: C.tint }]}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: C.inputBackground }]}>
          <Feather name="search" size={16} color={C.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Ürün, marka veya renk ara..."
            placeholderTextColor={C.textTertiary}
            style={[styles.searchInput, { color: C.text }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={C.textTertiary} />
            </Pressable>
          )}
        </View>

        <Text style={[styles.countText, { color: C.textTertiary }]}>
          {filtered.length} ürün
        </Text>
      </View>

      {/* Category Filter */}
      <CategoryFilter selected={category} onSelect={setCategory} />

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.tint} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="shopping-bag"
          title={items.length === 0 ? "Gardırobunuz boş" : "Sonuç bulunamadı"}
          subtitle={
            items.length === 0
              ? "İlk ürününüzü ekleyerek dijital gardırobunuzu oluşturmaya başlayın."
              : "Arama kriterlerinizi değiştirmeyi deneyin."
          }
          actionLabel={items.length === 0 ? "İlk Ürünü Ekle" : undefined}
          onAction={items.length === 0 ? () => router.push("/add-item") : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ClothingCard
                item={item}
                size="small"
                onPress={() =>
                  router.push({ pathname: "/item/[id]", params: { id: item.id } })
                }
                onFavoriteToggle={() => toggleFavorite(item.id)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  row: {
    gap: 12,
    justifyContent: "space-between",
  },
  cardWrapper: {
    flex: 1,
    maxWidth: "50%",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
