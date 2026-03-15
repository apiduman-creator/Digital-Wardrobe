import { ClosetItem, Season, Occasion } from "@/context/ClosetContext";

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
  season?: Season,
  occasion?: Occasion
): GeneratedOutfit {
  const filterItems = (cats: ClosetItem["category"][]) => {
    return items.filter((item) => {
      const catMatch = cats.includes(item.category);
      const seasonMatch =
        !season || item.season === "all" || item.season === season;
      const occasionMatch = !occasion || item.occasion === occasion;
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
    const occasion = outfit.top.occasion;
    const label = occasion.charAt(0).toUpperCase() + occasion.slice(1);
    return `${label} ${parts.join(" & ")} Look`;
  }
  return `${parts.join(" & ")} Outfit`;
}

export function getColorContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1A1A1A" : "#FFFFFF";
}
