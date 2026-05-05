import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CATEGORIES } from "@/constants/colors";
import { useCloset } from "@/context/ClosetContext";

// ─── Palette — Atelier Couture ────────────────────────────────────────────────
const P = {
  bg:          "#F9F3EA",   // warm parchment
  bgDeep:      "#EEE4D0",   // deeper parchment
  ink:         "#2C1A0E",   // deep espresso brown
  inkMid:      "#7B5A45",   // mahogany mid
  inkLight:    "#A88B75",   // dusty rose-brown
  accent:      "#C84B4B",   // terracotta red — hero color
  accentGold:  "#C9A96E",   // warm gold — secondary
  cardBg:      "#FFFDF7",   // warm white card
  border:      "#DDD0BC",   // warm sand border
  borderLight: "#EDE3D5",   // hairline border
  tagBg:       "#F5EBD8",   // tag background
  white:       "#FFFFFF",
};

// ─── Layout constants ──────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get("window");
const CARD_WIDTH  = Math.round(SW * 0.60);           // ≈225 @ 375pt
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.60);   // ≈360 @ 375pt
const GAP         = Math.round(SW * 0.032);          // ≈12 @ 375pt
const ITEM_WIDTH  = CARD_WIDTH + GAP;
const SIDE_INSET  = (SW - ITEM_WIDTH) / 2;
const COLOR_BLOCK = Math.round(CARD_HEIGHT * 0.55);  // ≈198 @ 360pt
const SWATCH_D    = Math.round(CARD_WIDTH * 0.46);   // ≈103 @ 225pt — inner circle
const SWATCH_FRAME = SWATCH_D + 20;                  // ≈123 — outer ring (with mat gap)

const ROTATE_DEG   = 26;
const SCALE_SIDE   = 0.86;
const OPACITY_SIDE = 0.58;
const PERSPECTIVE  = 1000;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  if (!hex || hex.length < 7) return `rgba(201,169,110,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  dirty:          { label: "Kirlide",        color: P.accent,  bg: "#FFF0EE" },
  washing:        { label: "Yıkamada",       color: "#5B9BD5", bg: "#EAF3FF" },
  "dry-cleaning": { label: "Kuru Temizleme", color: "#9B72CF", bg: "#F3EDFF" },
};

const SEASON_TR: Record<string, string> = {
  spring: "İlkbahar", summer: "Yaz", fall: "Sonbahar", winter: "Kış", all: "Tüm Mevsimler",
};

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function ClosetScreen() {
  const insets = useSafeAreaInsets();
  const { items, toggleFavorite, loading } = useCloset();

  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("all");
  const [readyOnly, setReadyOnly] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchCategory = category === "all" || item.category === category;
        const matchSearch =
          search.trim() === "" ||
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.brand && item.brand.toLowerCase().includes(search.toLowerCase())) ||
          item.color.toLowerCase().includes(search.toLowerCase());
        const matchReady = !readyOnly || !item.status || item.status === "ready";
        return matchCategory && matchSearch && matchReady;
      }),
    [items, category, search, readyOnly]
  );

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 100;

  const isEmpty         = filtered.length === 0;
  const isGloballyEmpty = items.length === 0;
  const emptyCategoryName = CATEGORIES.find((c) => c.id === category)?.label ?? category;

  // ── Sticky Header ────────────────────────────────────────────────────────────
  const StickyHeader = (
    <View style={[styles.header, { paddingTop: topPad + 2 }]}>

      {/* Title row: [titleBlock flex:1] [addBtn] */}
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.titleSub}>Dijital</Text>
          <Text style={styles.titleMain}>Gardırop</Text>
          <Text style={styles.itemCount}>
            {filtered.length} parça{readyOnly ? "  ·  Giymeye hazır" : ""}
          </Text>
        </View>
        <Pressable onPress={() => router.push("/add-item")} style={styles.addBtn}>
          <Feather name="plus" size={20} color={P.white} />
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={15} color={P.inkLight} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Ürün, marka veya renk ara..."
          placeholderTextColor={P.inkLight}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Feather name="x" size={14} color={P.inkLight} />
          </Pressable>
        )}
      </View>

      {/* "What to wear today" banner */}
      <Pressable
        onPress={() => setReadyOnly((v) => !v)}
        style={[styles.readyBanner, readyOnly && styles.readyBannerActive]}
      >
        <View style={[styles.readyBannerBar, readyOnly && styles.readyBannerBarActive]} />
        <Feather name="sun" size={13} color={readyOnly ? P.accent : P.inkLight} />
        <Text style={[styles.readyBannerText, readyOnly && styles.readyBannerTextActive]}>
          Bugün Ne Giyebilirim?
        </Text>
        {readyOnly && (
          <Feather name="x" size={11} color={P.accent} style={{ marginLeft: "auto" }} />
        )}
      </Pressable>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => {
          const selected = category === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        {StickyHeader}
        <View style={styles.centered}>
          <ActivityIndicator color={P.accent} size="large" />
        </View>
      </View>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <View style={styles.container}>
        {StickyHeader}
        <View style={styles.emptyWrapper}>
          {isGloballyEmpty ? (
            <>
              <Image
                source={require("@/assets/images/mascot/empty.png")}
                style={styles.emptyMascot}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>Gardırobun boş</Text>
              <Text style={styles.emptySub}>
                İlk kıyafetini eklemek için + butonuna bas
              </Text>
              <Pressable
                onPress={() => router.push("/add-item")}
                style={styles.emptyBtn}
              >
                <Feather name="plus" size={16} color={P.white} />
                <Text style={styles.emptyBtnText}>İlk Kıyafeti Ekle</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Feather name="tag" size={40} color={P.inkLight} />
              <Text style={styles.emptyTitle}>
                "{emptyCategoryName}" kategorisinde{"\n"}kıyafet yok
              </Text>
              <Text style={styles.emptySub}>
                Sağ üstteki + butonuna basarak ekleyebilirsin
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  // ── Cover Flow Carousel ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Background decorative blobs */}
      <View style={styles.blobTopRight} pointerEvents="none" />
      <View style={styles.blobMidLeft}  pointerEvents="none" />

      {StickyHeader}

      <View style={styles.carouselWrapper}>
        <Animated.FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          disableIntervalMomentum
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={styles.carouselContent}
          style={styles.carousel}
          renderItem={({ item, index }) => {
            const inputRange = [
              (index - 1) * ITEM_WIDTH,
              index       * ITEM_WIDTH,
              (index + 1) * ITEM_WIDTH,
            ];
            const rotateY = scrollX.interpolate({
              inputRange,
              outputRange: [`${ROTATE_DEG}deg`, "0deg", `-${ROTATE_DEG}deg`],
              extrapolate: "clamp",
            });
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [SCALE_SIDE, 1, SCALE_SIDE],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [OPACITY_SIDE, 1, OPACITY_SIDE],
              extrapolate: "clamp",
            });

            const season: string =
              (item as any).season ?? ((item as any).seasons?.[0] ?? "");
            const colorHex = item.colorHex || "#C9A96E";

            return (
              <Animated.View
                style={[
                  styles.cardOuter,
                  {
                    opacity,
                    transform: [{ perspective: PERSPECTIVE }, { rotateY }, { scale }],
                  },
                ]}
              >
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/item/[id]", params: { id: item.id } })
                  }
                  style={styles.card}
                >
                  {/* ── Color section ── */}
                  <View
                    style={[
                      styles.colorSection,
                      { height: COLOR_BLOCK, backgroundColor: hexToRgba(colorHex, 0.10) },
                    ]}
                  >
                    {item.imageUri ? (
                      <Image
                        source={{ uri: item.imageUri }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : (
                      /* Portrait-mat swatch: colored ring → warm-white gap → colored circle */
                      <View style={[styles.swatchFrame, { borderColor: colorHex }]}>
                        <View style={[styles.swatchDot, { backgroundColor: colorHex }]} />
                      </View>
                    )}

                    {/* Gradient bleed — only for photo cards, softer opacity */}
                    {item.imageUri ? (
                      <LinearGradient
                        colors={["transparent", "rgba(255,253,247,0.6)"]}
                        style={styles.colorGradient}
                        pointerEvents="none"
                      />
                    ) : null}

                    {/* Category pill + fav button */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{item.category}</Text>
                      </View>
                      <Pressable
                        onPress={() => toggleFavorite(item.id)}
                        style={styles.favBtn}
                        hitSlop={8}
                      >
                        <Feather
                          name="heart"
                          size={15}
                          color={item.favorite ? P.accent : "rgba(44,26,14,0.30)"}
                        />
                      </Pressable>
                    </View>

                    {/* Status badge */}
                    {item.status && item.status !== "ready" && STATUS_BADGE[item.status] ? (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: STATUS_BADGE[item.status].bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: STATUS_BADGE[item.status].color },
                          ]}
                        >
                          {STATUS_BADGE[item.status].label}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* ── Info section ── */}
                  <View style={styles.cardInfo}>
                    {/* Category label — small caps, terracotta */}
                    <Text style={styles.cardCategoryLabel}>
                      {item.category.toUpperCase()}
                    </Text>

                    {/* Item name — Playfair Display */}
                    <Text style={styles.cardName} numberOfLines={2}>
                      {item.name}
                    </Text>

                    {/* Brand */}
                    {item.brand ? (
                      <Text style={styles.cardBrand} numberOfLines={1}>
                        {item.brand}
                      </Text>
                    ) : null}

                    {/* Tags row — sadece mevsim */}
                    {season ? (
                      <View style={styles.tagsRow}>
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>{SEASON_TR[season] ?? season}</Text>
                        </View>
                      </View>
                    ) : null}

                    {/* Wear count */}
                    {item.wearCount > 0 ? (
                      <View style={styles.wearRow}>
                        <View style={styles.wearDot} />
                        <Text style={styles.wearText}>{item.wearCount}× giyildi</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </Animated.View>
            );
          }}
        />
        <View style={{ height: insets.bottom + 84 + 16 }} />
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: P.bg,
  },

  // ── Background blobs ──────────────────────────────────────────────────────────
  blobTopRight: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: P.accent,
    opacity: 0.05,
    top: -80,
    right: -80,
    zIndex: 0,
  },
  blobMidLeft: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: P.accentGold,
    opacity: 0.07,
    top: 60,
    left: -70,
    zIndex: 0,
  },

  // ── Header ────────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: P.bg,
    paddingBottom: 10,
    gap: 10,
    zIndex: 2,
    overflow: "visible",
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: P.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 10,
    elevation: 6,
  },

  // ── Title row ─────────────────────────────────────────────────────────────────
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  titleBlock: {
    flex: 1,
  },
  titleSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: P.inkLight,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 0,
  },
  titleMain: {
    fontSize: 48,
    fontFamily: "PlayfairDisplay_700Bold",
    color: P.ink,
    lineHeight: 52,
    letterSpacing: -1.5,
  },
  itemCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: P.inkLight,
    marginTop: 6,
  },

  // ── Search ────────────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: P.border,
    backgroundColor: P.cardBg,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: P.ink,
  },

  // ── Ready banner ──────────────────────────────────────────────────────────────
  readyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: P.tagBg,
    borderWidth: 1,
    borderColor: P.border,
    overflow: "hidden",
  },
  readyBannerActive: {
    backgroundColor: "#FFF0EE",
    borderColor: P.accent,
  },
  readyBannerBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: P.border,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  readyBannerBarActive: {
    backgroundColor: P.accent,
  },
  readyBannerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: P.inkMid,
  },
  readyBannerTextActive: {
    color: P.accent,
    fontFamily: "Inter_600SemiBold",
  },

  // ── Category chips ────────────────────────────────────────────────────────────
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
    backgroundColor: P.tagBg,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipSelected: {
    backgroundColor: P.accent,
    borderColor: P.accent,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: P.inkMid,
    textTransform: "capitalize",
  },
  chipTextSelected: {
    color: P.white,
    fontFamily: "Inter_600SemiBold",
  },

  // ── Carousel ──────────────────────────────────────────────────────────────────
  carouselWrapper: {
    flex: 1,
    backgroundColor: "transparent",
    overflow: "visible",
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    paddingHorizontal: SIDE_INSET,
  },

  // ── Card outer (shadow host) ──────────────────────────────────────────────────
  cardOuter: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: GAP / 2,
  },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    elevation: 10,
  },

  // ── Color section ─────────────────────────────────────────────────────────────
  colorSection: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  // Portrait-mat swatch: [colored border] [warm-white gap via bg] [colored fill]
  swatchFrame: {
    width: SWATCH_FRAME,
    height: SWATCH_FRAME,
    borderRadius: SWATCH_FRAME / 2,
    borderWidth: 2.5,
    backgroundColor: P.cardBg,   // this IS the white mat gap
    alignItems: "center",
    justifyContent: "center",
  },
  swatchDot: {
    width: SWATCH_D,
    height: SWATCH_D,
    borderRadius: SWATCH_D / 2,
  },

  // Gradient bleed at bottom of color section → seamless card info join
  colorGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
  },

  // Overlaid controls on top of color section
  cardTopRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryPill: {
    backgroundColor: "rgba(44,26,14,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryPillText: {
    color: P.white,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  favBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,253,247,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  // ── Card info ─────────────────────────────────────────────────────────────────
  cardInfo: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 4,
    justifyContent: "center",
  },
  cardCategoryLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: P.accent,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  cardName: {
    fontSize: 19,
    fontFamily: "PlayfairDisplay_700Bold",
    color: P.ink,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  cardBrand: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: P.inkMid,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 6,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: P.tagBg,
    borderWidth: 1,
    borderColor: P.borderLight,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: P.inkMid,
    textTransform: "capitalize",
  },
  wearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  wearDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: P.accentGold,
  },
  wearText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: P.inkLight,
  },

  // ── Misc ──────────────────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyMascot: {
    width: 220,
    height: 220,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "PlayfairDisplay_700Bold",
    color: P.ink,
    textAlign: "center",
    lineHeight: 28,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: P.inkLight,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: P.accent,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: P.white,
  },

});
