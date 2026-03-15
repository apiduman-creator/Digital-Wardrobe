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
  { id: "all", label: "All", icon: "grid" as const },
  { id: "tops", label: "Tops", icon: "layers" as const },
  { id: "bottoms", label: "Bottoms", icon: "minus" as const },
  { id: "dresses", label: "Dresses", icon: "star" as const },
  { id: "outerwear", label: "Outerwear", icon: "wind" as const },
  { id: "shoes", label: "Shoes", icon: "arrow-up" as const },
  { id: "accessories", label: "Accessories", icon: "watch" as const },
  { id: "bags", label: "Bags", icon: "shopping-bag" as const },
  { id: "activewear", label: "Activewear", icon: "activity" as const },
  { id: "sleepwear", label: "Sleepwear", icon: "moon" as const },
  { id: "other", label: "Other", icon: "more-horizontal" as const },
] as const;

export const SEASONS = ["all", "spring", "summer", "fall", "winter"] as const;
export const OCCASIONS = ["casual", "work", "formal", "sport", "lounge", "special"] as const;

export const COLOR_PALETTE = [
  { name: "Black", hex: "#1A1A1A" },
  { name: "White", hex: "#F5F2EE" },
  { name: "Grey", hex: "#9E9E9E" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Green", hex: "#4CAF77" },
  { name: "Olive", hex: "#7D8B3C" },
  { name: "Yellow", hex: "#F59E0B" },
  { name: "Orange", hex: "#F97316" },
  { name: "Red", hex: "#E05252" },
  { name: "Pink", hex: "#F472B6" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Brown", hex: "#92400E" },
  { name: "Beige", hex: "#C9A96E" },
  { name: "Cream", hex: "#F5F0E8" },
];
