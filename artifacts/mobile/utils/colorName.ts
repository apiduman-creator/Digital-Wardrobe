/**
 * Hex renk kodunu Türkçe insan-okunabilir isme çevirir.
 * HSL renk uzayı kullanılır: ton (hue), doygunluk (saturation), parlaklık (lightness).
 */

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, "");
  if (clean.length !== 6) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

export function hexToColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Özel Renk";

  const [h, s, l] = rgbToHsl(...rgb);

  // ── Akromatik (gri/beyaz/siyah) ──────────────────────────────────────────
  if (s < 10) {
    if (l > 92) return "Beyaz";
    if (l > 78) return "Açık Gri";
    if (l > 58) return "Gri";
    if (l > 35) return "Koyu Gri";
    if (l > 15) return "Antrasit";
    return "Siyah";
  }

  // Düşük doygunluk — nötr tonlar
  if (s < 22) {
    if (l > 80) return "Kırık Beyaz";
    if (l > 60) return "Açık Gri";
    if (l > 38) return "Gri";
    return "Koyu Gri";
  }

  // ── Kahverengi (koyu turuncu/sarı) ───────────────────────────────────────
  if (h >= 15 && h <= 52 && l < 42 && s < 72) {
    if (l < 18) return "Koyu Kahverengi";
    if (l < 28) return "Kahverengi";
    if (l < 35) return "Fındık";
    return "Açık Kahverengi";
  }

  // ── Zeytin yeşili ─────────────────────────────────────────────────────────
  if (h >= 52 && h <= 90 && l < 40 && s < 65) {
    return l < 25 ? "Koyu Zeytin" : "Zeytin";
  }

  // ── Krom renk aralıkları (ton bazlı) ──────────────────────────────────────
  const isDark      = l < 28;
  const isMidDark   = l >= 28 && l < 40;
  const isMid       = l >= 40 && l < 62;
  const isLight     = l >= 62 && l < 78;
  const isVeryLight = l >= 78;
  const isPastel    = s < 42 && l > 62;

  // Kırmızı  (0-12 ve 350-360)
  if (h < 12 || h >= 350) {
    if (isDark && s > 50)     return "Bordo";
    if (isPastel)             return "Açık Pembe";
    if (isVeryLight)          return "Gül Kurusu";
    if (isLight)              return "Açık Kırmızı";
    if (isMidDark)            return "Koyu Kırmızı";
    return "Kırmızı";
  }

  // Kızıl / Mercan (12-25)
  if (h < 25) {
    if (isDark)               return "Bordo";
    if (isPastel || isLight)  return "Mercan";
    return "Kızıl";
  }

  // Turuncu (25-44)
  if (h < 44) {
    if (isDark)               return "Kiremit";
    if (isPastel)             return "Şeftali";
    if (isLight || isVeryLight) return "Açık Turuncu";
    return "Turuncu";
  }

  // Sarı (44-68)
  if (h < 68) {
    if (isDark || isMidDark)  return "Hardal";
    if (isPastel)             return "Açık Sarı";
    if (isVeryLight)          return "Krem";
    return "Sarı";
  }

  // Sarı-Yeşil / Fıstık (68-85)
  if (h < 85) {
    if (isDark || isMidDark)  return "Zeytin";
    if (isPastel || isLight)  return "Fıstık";
    return "Sarı Yeşil";
  }

  // Yeşil (85-155)
  if (h < 155) {
    if (h < 110) {
      if (isDark)             return "Orman Yeşili";
      if (isPastel)           return "Açık Yeşil";
      return "Yeşil";
    }
    // Koyu/çimen yeşili
    if (isDark)               return "Koyu Yeşil";
    if (isPastel || isLight)  return "Açık Yeşil";
    return "Çimen Yeşili";
  }

  // Turkuaz / Zümrüt (155-178)
  if (h < 178) {
    if (isDark || isMidDark)  return "Zümrüt";
    if (isPastel)             return "Açık Turkuaz";
    return "Turkuaz";
  }

  // Camgöbeği / Teal (178-200)
  if (h < 200) {
    if (isDark)               return "Koyu Camgöbeği";
    if (isPastel || isLight)  return "Açık Camgöbeği";
    return "Camgöbeği";
  }

  // Açık mavi / Bebek mavisi (200-220)
  if (h < 220) {
    if (isDark || isMidDark)  return "Çelik Mavisi";
    if (isPastel || isVeryLight) return "Bebek Mavisi";
    return "Açık Mavi";
  }

  // Mavi (220-248)
  if (h < 248) {
    if (isDark || isMidDark)  return "Lacivert";
    if (isPastel)             return "Pastel Mavi";
    if (isLight || isVeryLight) return "Açık Mavi";
    return "Mavi";
  }

  // İndigo (248-268)
  if (h < 268) {
    if (isDark || isMidDark)  return "Lacivert";
    return "İndigo";
  }

  // Mor (268-292)
  if (h < 292) {
    if (isDark || isMidDark)  return "Koyu Mor";
    if (isPastel || isVeryLight) return "Leylak";
    if (isLight)              return "Açık Mor";
    return "Mor";
  }

  // Eflatun / Magenta (292-318)
  if (h < 318) {
    if (isDark || isMidDark)  return "Koyu Eflatun";
    if (isPastel || isLight)  return "Eflatun";
    return "Mor Pembe";
  }

  // Pembe / Fuşya (318-350)
  if (h < 340) {
    if (isDark)               return "Fuşya";
    if (isPastel || isVeryLight) return "Pudra Pembesi";
    if (isLight)              return "Açık Pembe";
    if (s > 70 && isMid)     return "Fuşya";
    return "Pembe";
  }

  // Pembe-kırmızı (340-350)
  if (isDark)                 return "Bordo";
  if (isPastel || isLight)    return "Gül Kurusu";
  return "Pembe";
}
