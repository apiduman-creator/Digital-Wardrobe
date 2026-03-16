import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { Outfit, ClosetItem } from "@/context/ClosetContext";

interface Props {
  outfit: Outfit;
  items: ClosetItem[];
  onPress: () => void;
  onFavoriteToggle: () => void;
  onDelete: () => void;
}

export function OutfitCard({ outfit, items, onPress, onFavoriteToggle, onDelete }: Props) {
  const C = Colors.light;
  const swipeRef = useRef<Swipeable>(null);

  const handleFavorite = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavoriteToggle();
  };

  const handleDelete = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    swipeRef.current?.close();
    onDelete();
  };

  const outfitItems = outfit.itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as ClosetItem[];

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    drag: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
      extrapolate: "clamp",
    });
    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
      extrapolate: "clamp",
    });
    return (
      <Animated.View style={[styles.swipeAction, { opacity, transform: [{ scale }] }]}>
        <Pressable onPress={handleDelete} style={styles.swipeDeleteBtn}>
          <Feather name="trash-2" size={20} color="#FFF" />
          <Text style={styles.swipeDeleteText}>Sil</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const card = (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderColor: C.cardBorder, backgroundColor: C.card }]}
    >
      {/* Color strip preview */}
      <View style={styles.colorStrip}>
        {outfitItems.length > 0 ? (
          outfitItems.slice(0, 6).map((item) => (
            <View key={item.id} style={[styles.colorSegment, { backgroundColor: item.colorHex || "#CCC" }]} />
          ))
        ) : (
          <View style={[styles.colorSegment, { flex: 1, backgroundColor: C.chip }]} />
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>{outfit.name}</Text>
          <Pressable onPress={handleFavorite} hitSlop={8}>
            <Feather name="heart" size={18} color={outfit.favorite ? "#E05252" : C.textTertiary} />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: C.chip }]}>
            <Text style={[styles.badgeText, { color: C.textSecondary }]}>{outfit.occasion}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: C.chip }]}>
            <Text style={[styles.badgeText, { color: C.textSecondary }]}>{outfit.season}</Text>
          </View>
          <Text style={[styles.pieceCount, { color: C.textTertiary }]}>{outfitItems.length} parça</Text>
        </View>

        {outfitItems.length > 0 && (
          <Text style={[styles.pieces, { color: C.textSecondary }]} numberOfLines={1}>
            {outfitItems.map((i) => i.name).join(", ")}
          </Text>
        )}
      </View>
    </Pressable>
  );

  if (Platform.OS === "web") {
    return card;
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={60}
      friction={2}
      overshootRight={false}
    >
      {card}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  colorStrip: { height: 10, flexDirection: "row" },
  colorSegment: { flex: 1 },
  body: { padding: 14, gap: 8 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1, marginRight: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
  pieceCount: { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: "auto" },
  pieces: { fontSize: 12, fontFamily: "Inter_400Regular" },
  swipeAction: {
    width: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  swipeDeleteBtn: {
    width: 68,
    height: "90%",
    borderRadius: 14,
    backgroundColor: "#E05252",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  swipeDeleteText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#FFF" },
});
