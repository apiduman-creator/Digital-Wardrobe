// ─── Türkçe görüntü etiketleri ────────────────────────────────────────────────
// Veride İngilizce anahtarlar tutuluyor ("outerwear", "casual", "fall"...).
// Ekranda HER ZAMAN bu yardımcılardan geçirilerek gösterilmeli — ham anahtarı
// doğrudan <Text> içine yazmak ekranda İngilizce görünmesine yol açıyor.

export const CATEGORY_TR: Record<string, string> = {
  tops: "Üstler",
  bottoms: "Altlar",
  dresses: "Elbiseler",
  outerwear: "Dış Giyim",
  shoes: "Ayakkabılar",
  accessories: "Aksesuarlar",
  bags: "Çantalar",
  activewear: "Spor Giyim",
  sleepwear: "Pijamalar",
  other: "Diğer",
};

export const OCCASION_TR: Record<string, string> = {
  casual: "Günlük",
  work: "İş",
  formal: "Resmi",
  sport: "Spor",
  lounge: "Ev",
  special: "Özel",
};

export const SEASON_TR: Record<string, string> = {
  spring: "İlkbahar",
  summer: "Yaz",
  fall: "Sonbahar",
  winter: "Kış",
  all: "Tüm Mevsimler",
};

const SEASON_ORDER = ["spring", "summer", "fall", "winter"];

export const categoryLabel = (id: string | undefined) => (id ? CATEGORY_TR[id] ?? id : "");
export const occasionLabel = (id: string | undefined) => (id ? OCCASION_TR[id] ?? id : "");
export const seasonLabel = (id: string | undefined) => (id ? SEASON_TR[id] ?? id : "");

/** item.occasion bir JSON dizi stringi ('["casual","work"]') ya da tek değer olabilir. */
export function parseOccasions(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [raw];
  } catch {
    return [raw];
  }
}

/** Mevsimleri takvim sırasına dizer; dördü birden seçiliyse tek "Tüm Mevsimler" döner. */
export function seasonLabels(seasons: string[] | undefined): string[] {
  const raw = seasons ?? [];
  if (raw.includes("all")) return [SEASON_TR.all];
  const unique = SEASON_ORDER.filter((s) => raw.includes(s));
  if (unique.length === 0) return [];
  if (unique.length === 4) return [SEASON_TR.all];
  return unique.map(seasonLabel);
}

/**
 * Türkçe büyük harf: JS'in toUpperCase()'i "i"yi "I" yapar ("Dış Giyim" → "DIŞ GIYIM").
 * Doğrusu "DIŞ GİYİM". Ayrıca stillerdeki textTransform: "uppercase" da Türkçe
 * kuralını bilmiyor — bu yüzden metni burada önceden büyütüyoruz.
 */
export function trUpper(s: string): string {
  return s.replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase();
}
