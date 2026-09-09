const accent = "#C9A96E";
const accentDark = "#A8824A";

export default {
  light: {
    text: "#1A1A1A",
    textSecondary: "#6B6B6B",
    textTertiary: "#9E9E9E",
    background: "#F5F2EE",
    backgroundSecondary: "#FFFDFB",
    card: "#FFFFFF",
    cardBorder: "#E8E2D9",
    tint: accent,
    tintDark: accentDark,
    tabIconDefault: "#A8A096",
    tabIconSelected: accent,
    destructive: "#E05252",
    success: "#4CAF77",
    overlay: "rgba(26, 26, 26, 0.55)",
    inputBackground: "#F0EDE8",
    separator: "#E8E2D9",
    chip: "#EDE8E2",
    chipSelected: accent,
    chipTextSelected: "#FFFFFF",
  },
};

export const CATEGORIES = [
  { id: "all", label: "Tümü", icon: "grid" as const },
  { id: "tops", label: "Üstler", icon: "layers" as const },
  { id: "bottoms", label: "Altlar", icon: "minus" as const },
  { id: "dresses", label: "Elbiseler", icon: "star" as const },
  { id: "outerwear", label: "Dış Giyim", icon: "wind" as const },
  { id: "shoes", label: "Ayakkabılar", icon: "arrow-up" as const },
  { id: "accessories", label: "Aksesuarlar", icon: "watch" as const },
  { id: "bags", label: "Çantalar", icon: "shopping-bag" as const },
  { id: "activewear", label: "Spor Giyim", icon: "activity" as const },
  { id: "sleepwear", label: "Pijamalar", icon: "moon" as const },
  { id: "other", label: "Diğer", icon: "more-horizontal" as const },
] as const;

export const SEASONS = ["all", "spring", "summer", "fall", "winter"] as const;
export const OCCASIONS = [
  "casual",
  "work",
  "formal",
  "sport",
  "lounge",
  "special",
] as const;

export const COLOR_PALETTE = [
  { name: "Black", nameTr: "Siyah", hex: "#1A1A1A" },
  { name: "White", nameTr: "Beyaz", hex: "#F5F2EE" },
  { name: "Grey", nameTr: "Gri", hex: "#9E9E9E" },
  { name: "Navy", nameTr: "Lacivert", hex: "#1B2A4A" },
  { name: "Blue", nameTr: "Mavi", hex: "#3B82F6" },
  { name: "Teal", nameTr: "Camgöbeği", hex: "#14B8A6" },
  { name: "Green", nameTr: "Yeşil", hex: "#4CAF77" },
  { name: "Olive", nameTr: "Zeytin Yeşili", hex: "#7D8B3C" },
  { name: "Yellow", nameTr: "Sarı", hex: "#F59E0B" },
  { name: "Orange", nameTr: "Turuncu", hex: "#F97316" },
  { name: "Red", nameTr: "Kırmızı", hex: "#E05252" },
  { name: "Pink", nameTr: "Pembe", hex: "#F472B6" },
  { name: "Purple", nameTr: "Mor", hex: "#8B5CF6" },
  { name: "Brown", nameTr: "Kahverengi", hex: "#92400E" },
  { name: "Beige", nameTr: "Bej", hex: "#C9A96E" },
  { name: "Cream", nameTr: "Krem", hex: "#F5F0E8" },
];
