import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { Outfit, ClosetItem } from "@/context/ClosetContext";

interface Props {
  outfit: Outfit;
  items: ClosetItem[];
  onPress: () => void;
  onFavoriteToggle: () => void;
}

export function OutfitCard({ outfit, items, onPress, onFavoriteToggle }: Props) {
  const C = Colors.light;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  const handlePressOut = () => scale.value = withSpring(1, { damping: 20, stiffness: 300 });

  const handleFavorite = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavoriteToggle();
  };

  const outfitItems = outfit.itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as ClosetItem[];

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { borderColor: C.cardBorder }]}
      >
        {/* Color strip preview */}
        <View style={styles.colorStrip}>
          {outfitItems.length > 0 ? (
            outfitItems.slice(0, 6).map((item) => (
              <View
                key={item.id}
                style={[styles.colorSegment, { backgroundColor: item.colorHex || "#CCC" }]}
              />
            ))
          ) : (
            <View style={[styles.colorSegment, { flex: 1, backgroundColor: C.chip }]} />
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
              {outfit.name}
            </Text>
            <Pressable onPress={handleFavorite} hitSlop={8}>
              <Feather
                name="heart"
                size={18}
                color={outfit.favorite ? "#E05252" : C.textTertiary}
              />
            </Pressable>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: C.chip }]}>
              <Text style={[styles.badgeText, { color: C.textSecondary }]}>{outfit.occasion}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: C.chip }]}>
              <Text style={[styles.badgeText, { color: C.textSecondary }]}>{outfit.season}</Text>
            </View>
            <Text style={[styles.pieceCount, { color: C.textTertiary }]}>
              {outfitItems.length} parça
            </Text>
          </View>

          {outfitItems.length > 0 && (
            <Text style={[styles.pieces, { color: C.textSecondary }]} numberOfLines={1}>
              {outfitItems.map((i) => i.name).join(", ")}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  colorStrip: {
    height: 10,
    flexDirection: "row",
  },
  colorSegment: {
    flex: 1,
  },
  body: {
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
  },
  pieceCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginLeft: "auto",
  },
  pieces: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
