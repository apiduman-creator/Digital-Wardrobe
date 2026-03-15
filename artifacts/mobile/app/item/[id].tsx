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

export default function ItemDetailScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, deleteItem, toggleFavorite, logWear } = useCloset();

  const item = items.find((i) => i.id === id);

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <Text style={{ color: C.textSecondary, textAlign: "center", marginTop: 80 }}>
          Ürün bulunamadı.
        </Text>
      </View>
    );
  }

  const textColor = getColorContrastText(item.colorHex || "#999");

  const handleDelete = () => {
    Alert.alert(
      "Ürünü Sil",
      `"${item.name}" silinecek. Emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await deleteItem(item.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleWear = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logWear(item.id);
  };

  const handleFavorite = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(item.id);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Color Hero */}
      <View style={[styles.hero, { backgroundColor: item.colorHex || "#CCC" }]}>
        <Text style={[styles.heroCategory, { color: textColor, opacity: 0.7 }]}>
          {item.category.toUpperCase()}
        </Text>
        <Text style={[styles.heroName, { color: textColor }]}>{item.name}</Text>
        {item.brand && (
          <Text style={[styles.heroBrand, { color: textColor, opacity: 0.75 }]}>{item.brand}</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionsRow, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
        <Pressable onPress={handleFavorite} style={styles.actionBtn}>
          <Feather
            name="heart"
            size={22}
            color={item.favorite ? "#E05252" : C.textSecondary}
          />
          <Text style={[styles.actionLabel, { color: C.textSecondary }]}>
            {item.favorite ? "Favori" : "Favori Ekle"}
          </Text>
        </Pressable>

        <View style={[styles.actionDivider, { backgroundColor: C.separator }]} />

        <Pressable onPress={handleWear} style={styles.actionBtn}>
          <Feather name="check-circle" size={22} color={C.tint} />
          <Text style={[styles.actionLabel, { color: C.tint }]}>Bugün Giydim</Text>
        </Pressable>

        <View style={[styles.actionDivider, { backgroundColor: C.separator }]} />

        <Pressable onPress={handleDelete} style={styles.actionBtn}>
          <Feather name="trash-2" size={22} color={C.destructive} />
          <Text style={[styles.actionLabel, { color: C.destructive }]}>Sil</Text>
        </Pressable>
      </View>

      {/* Details */}
      <View style={[styles.detailCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
        <DetailRow label="Renk" value={item.color} />
        <DetailRow label="Kategori" value={item.category} capitalize />
        <DetailRow label="Mevsim" value={item.season} capitalize />
        <DetailRow label="Kullanım" value={item.occasion} capitalize />
        {item.brand && <DetailRow label="Marka" value={item.brand} />}
        {item.notes && <DetailRow label="Notlar" value={item.notes} />}
      </View>

      {/* Wear Stats */}
      <View style={[styles.statsCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
        <Text style={[styles.statsTitle, { color: C.textSecondary }]}>İstatistikler</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: C.tint }]}>{item.wearCount}</Text>
            <Text style={[styles.statLabel, { color: C.textSecondary }]}>Kez Giyildi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: C.text }]}>
              {formatDate(item.lastWorn ?? undefined)}
            </Text>
            <Text style={[styles.statLabel, { color: C.textSecondary }]}>Son Giyim</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: C.text }]}>
              {formatDate(item.createdAt)}
            </Text>
            <Text style={[styles.statLabel, { color: C.textSecondary }]}>Eklendi</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  const C = Colors.light;
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: C.textSecondary }]}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          { color: C.text, textTransform: capitalize ? "capitalize" : "none" },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    padding: 32,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 4,
    alignItems: "center",
  },
  heroCategory: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  heroName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  heroBrand: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  actionsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 4,
  },
  actionDivider: {
    width: 1,
    marginVertical: 12,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  detailCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE4",
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  statsTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
