import {
  ClosetItem,
  Season,
  OutfitSeason,
  Occasion,
} from "@/context/ClosetContext";

export interface GeneratedOutfit {
  top: ClosetItem | null;
  bottom: ClosetItem | null;
  outerwear: ClosetItem | null;
  shoes: ClosetItem | null;
}

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomOutfit(
  items: ClosetItem[],
  season?: OutfitSeason,
  occasion?: Occasion,
): GeneratedOutfit {
  const filterItems = (cats: ClosetItem["category"][]) => {
    return items.filter((item) => {
      const catMatch = cats.includes(item.category);
      const seasonMatch =
        !season || season === "all" || item.seasons.includes(season as Season);
      const itemOccasions: string[] = (() => { try { const p = JSON.parse(item.occasion); return Array.isArray(p) ? p : [item.occasion]; } catch { return [item.occasion]; } })();
      const occasionMatch = !occasion || itemOccasions.includes(occasion);
      return catMatch && seasonMatch && occasionMatch;
    });
  };

  const tops = filterItems(["tops", "dresses", "activewear"]);
  const bottoms = filterItems(["bottoms"]);
  const outerwear = filterItems(["outerwear"]);
  const shoes = filterItems(["shoes"]);

  const selectedTop = pickRandom(tops);
  const isDress = selectedTop?.category === "dresses";

  return {
    top: selectedTop,
    bottom: isDress ? null : pickRandom(bottoms),
    outerwear: pickRandom(outerwear),
    shoes: pickRandom(shoes),
  };
}

export function suggestOutfitName(outfit: GeneratedOutfit): string {
  const parts: string[] = [];
  if (outfit.top) parts.push(outfit.top.color);
  if (outfit.bottom) parts.push(outfit.bottom.color);
  if (outfit.top?.occasion) {
    const raw = outfit.top.occasion;
    const occasions: string[] = (() => { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [raw]; } catch { return [raw]; } })();
    const first = occasions[0] ?? "";
    const label = first.charAt(0).toUpperCase() + first.slice(1);
    return `${label} ${parts.join(" & ")} Look`;
  }
  return `${parts.join(" & ")} Outfit`;
}

export function getColorContrastText(hex: string): string {
  const cleaned = hex.startsWith("#") ? hex : "#" + hex;
  if (cleaned.length < 7) return "#1A1A1A";
  const r = parseInt(cleaned.slice(1, 3), 16);
  const g = parseInt(cleaned.slice(3, 5), 16);
  const b = parseInt(cleaned.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1A1A1A" : "#FFFFFF";
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: "İlkbahar",
  summer: "Yaz",
  fall: "Sonbahar",
  winter: "Kış",
};
