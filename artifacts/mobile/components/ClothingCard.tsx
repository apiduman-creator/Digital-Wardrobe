import React from "react";
import { View, Text, StyleSheet, Pressable, Platform, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { ClosetItem } from "@/context/ClosetContext";
import { getColorContrastText } from "@/utils/outfitLogic";

interface Props {
  item: ClosetItem;
  onPress: () => void;
  onFavoriteToggle: () => void;
  size?: "small" | "large";
}

export function ClothingCard({ item, onPress, onFavoriteToggle, size = "large" }: Props) {
  const C = Colors.light;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
  const handlePressOut = () => scale.value = withSpring(1, { damping: 20, stiffness: 300 });

  const handleFavorite = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavoriteToggle();
  };

  const isSmall = size === "small";
  const blockHeight = isSmall ? 90 : 120;
  const textOnColor = getColorContrastText(item.colorHex || "#999");

  return (
    <Animated.View style={[animatedStyle, isSmall ? { flex: 1 } : {}]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { borderColor: C.cardBorder }]}
      >
        {/* Color block / Photo */}
        <View style={[styles.colorBlock, { backgroundColor: item.colorHex || "#CCC", height: blockHeight }]}>
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}
          <Text style={[styles.categoryLabel, { color: item.imageUri ? "#FFF" : textOnColor, opacity: 0.85, zIndex: 1 }]}>
            {item.category}
          </Text>
          <Pressable onPress={handleFavorite} style={styles.favoriteBtn} hitSlop={8}>
            <Feather
              name={item.favorite ? "heart" : "heart"}
              size={15}
              color={item.favorite ? "#FF4444" : "rgba(255,255,255,0.7)"}
            />
          </Pressable>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {!isSmall && item.brand ? (
            <Text style={[styles.brand, { color: C.textSecondary }]} numberOfLines={1}>
              {item.brand}
            </Text>
          ) : null}
          <View style={styles.tagsRow}>
            <Text style={[styles.tag, { color: C.textTertiary }]}>
              {item.color}
            </Text>
            <Text style={[styles.dot, { color: C.textTertiary }]}>·</Text>
            <Text style={[styles.tag, { color: C.textTertiary }]}>
              {(item.seasons ?? []).slice(0, 2).join(", ")}
            </Text>
          </View>
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
  colorBlock: {
    width: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  favoriteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  info: {
    padding: 10,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  brand: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  tag: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "capitalize",
  },
  dot: {
    fontSize: 11,
  },
});
