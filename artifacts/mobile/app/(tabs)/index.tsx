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
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Colors, { CATEGORIES } from "@/constants/colors";
import { useCloset } from "@/context/ClosetContext";
import { ClothingCard } from "@/components/ClothingCard";
import { EmptyState } from "@/components/EmptyState";

export default function ClosetScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { items, toggleFavorite, loading } = useCloset();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = category === "all" || item.category === category;
      const matchSearch =
        search.trim() === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(search.toLowerCase())) ||
        item.color.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [items, category, search]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 100;

  const isEmpty = filtered.length === 0;
  const isGloballyEmpty = items.length === 0;
  const emptyCategoryName = CATEGORIES.find((c) => c.id === category)?.label ?? category;

  const ListHeader = (
    <View style={styles.listHeader}>
      {/* Title Row */}
      <View style={[styles.headerTop, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Dijital</Text>
          <Text style={[styles.title, { color: C.text }]}>Gardırop</Text>
        </View>
        <Pressable
          onPress={() => router.push("/add-item")}
          style={[styles.addBtn, { backgroundColor: C.tint }]}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Search */}
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

      {/* Category Chips — directly under search, no gap */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setCategory(cat.id)}
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
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Count */}
      <Text style={[styles.countText, { color: C.textTertiary }]}>
        {filtered.length} ürün
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        {ListHeader}
        <View style={styles.centered}>
          <ActivityIndicator color={C.tint} size="large" />
        </View>
      </View>
    );
  }

  // Empty states — still inside a scrollable container
  if (isEmpty) {
    const title = isGloballyEmpty
      ? "Gardırobunuz boş"
      : `"${emptyCategoryName}" kategorisinde ürün bulunamadı`;
    const subtitle = isGloballyEmpty
      ? "İlk ürününüzü ekleyerek dijital gardırobunuzu oluşturmaya başlayın."
      : "Bu kategoriye ürün eklemek için sağ üstteki + butonuna basın.";

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: C.background }]}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {ListHeader}
        <EmptyState
          icon={isGloballyEmpty ? "shopping-bag" : "tag"}
          title={title}
          subtitle={subtitle}
          actionLabel={isGloballyEmpty ? "İlk Ürünü Ekle" : undefined}
          onAction={isGloballyEmpty ? () => router.push("/add-item") : undefined}
        />
      </ScrollView>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: C.background }]}
      data={filtered}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={() => ListHeader}
      contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listHeader: {
    paddingBottom: 8,
    gap: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
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
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginHorizontal: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    textTransform: "capitalize",
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 6,
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
    marginTop: 80,
  },
});
