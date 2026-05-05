# Digital Wardrobe — Proje Rehberi

Bu dosya, yeni bir AI konuşmasında projeyi hızlıca bağlama oturtmak için hazırlanmıştır.

---

## Proje Özeti

Kullanıcıların dijital dolap yönetimi yapabileceği bir mobil uygulama. Kıyafaleri kayıt altına alır, kombine eder, takvime işler.

**Platform:** React Native (Expo) + Express.js API + SQLite
**Paket yöneticisi:** pnpm (workspace monorepo)
**Dil:** TypeScript (strict mode)

---

## Monorepo Yapısı

```
Digital-Wardrobe/
├── artifacts/
│   ├── api-server/          Express.js REST API
│   └── mobile/              React Native Expo uygulaması
├── lib/
│   ├── db/                  Drizzle ORM + LibSQL (SQLite)
│   ├── api-client-react/    Orval tarafından üretilen API client (@tanstack/react-query)
│   ├── api-zod/             Orval tarafından üretilen Zod şemaları
│   └── api-spec/            OpenAPI spec + Orval kod üretim config'i
├── scripts/
├── local.db                 SQLite veritabanı dosyası (proje kökünde)
├── package.json             pnpm workspace root
└── tsconfig.base.json
```

**Workspace paket isimleri:**
- `@workspace/db` → `lib/db`
- `@workspace/api-server` → `artifacts/api-server`
- `@workspace/mobile` → `artifacts/mobile`
- `@workspace/api-client-react` → `lib/api-client-react`
- `@workspace/api-zod` → `lib/api-zod`

---

## Teknoloji Stack'i

### Backend (`artifacts/api-server`)
| Katman | Teknoloji |
|---|---|
| Framework | Express.js v5 |
| ORM | Drizzle ORM (`drizzle-orm/libsql`) |
| Veritabanı | SQLite via `@libsql/client` (WebAssembly — native build gerekmez) |
| Validasyon | Zod |
| Dev runner | `tsx` + `cross-env` |

**Önemli:** `better-sqlite3` KULLANILMIYOR. Windows'ta `node-gyp` / Visual Studio Build Tools gerektiriyor ve derleme başarısız oluyor. `@libsql/client` WASM tabanlı, build gerektirmez.

### Mobile (`artifacts/mobile`)
| Katman | Teknoloji |
|---|---|
| Framework | React Native 0.81.5 |
| Navigation | Expo Router v6 (file-based) |
| State | React Context API + AsyncStorage |
| Animasyon | React Native `Animated` API (native driver) |
| Renk seçici | `react-native-wheel-color-picker` |
| İkonlar | `@expo/vector-icons` (Feather) |
| Fontlar | Inter (400/500/600/700) via `expo-font` |
| Safe area | `react-native-safe-area-context` |
| Haptics | `expo-haptics` |

### Veritabanı (`lib/db`)
- **Dialect:** SQLite (`drizzle-orm/sqlite-core`)
- **Bağlantı:** `@libsql/client` — `file:../../local.db` (proje kökü)
- **Migration:** `drizzle-kit push` veya `drizzle-kit generate` (çıktı: `lib/db/drizzle/`)
- **Tablo init:** `api-server/src/index.ts` içinde `CREATE TABLE IF NOT EXISTS` ile elle yapılır

---

## Veritabanı Şeması

### `closet_items`
```
id          TEXT  PRIMARY KEY
name        TEXT  NOT NULL
category    TEXT  NOT NULL   -- tops | bottoms | dresses | outerwear | shoes | accessories | bags | activewear | sleepwear | other
color       TEXT  NOT NULL   -- Türkçe renk adı (örn: "Lacivert")
brand       TEXT  nullable
season      TEXT  NOT NULL   -- spring | summer | fall | winter | all  ← TEK değer (array DEĞİL)
occasion    TEXT  NOT NULL   -- casual | work | formal | sport | lounge | special
imageUri    TEXT  nullable
notes       TEXT  nullable
favorite    INTEGER(boolean) DEFAULT 0
wearCount   INTEGER          DEFAULT 0
lastWorn    TEXT  nullable    -- ISO string
createdAt   TEXT  NOT NULL    -- ISO string
updatedAt   TEXT  NOT NULL    -- ISO string
```

### `outfits`
```
id          TEXT  PRIMARY KEY
name        TEXT  NOT NULL
itemIds     TEXT  NOT NULL    -- JSON stringified array: '["id1","id2"]'
occasion    TEXT  NOT NULL
season      TEXT  NOT NULL
notes       TEXT  nullable
favorite    INTEGER(boolean) DEFAULT 0
createdAt   TEXT  NOT NULL
updatedAt   TEXT  NOT NULL
```

---

## API Endpoint'leri

Tüm route'lar `/api` prefix'i altında:

```
GET    /api/healthz
GET    /api/closet/items           ?category=  &season=  &color=
POST   /api/closet/items
GET    /api/closet/items/:id
PUT    /api/closet/items/:id
DELETE /api/closet/items/:id

GET    /api/outfits
POST   /api/outfits
GET    /api/outfits/:id
PUT    /api/outfits/:id
DELETE /api/outfits/:id
```

---

## Mobile Uygulama Yapısı

### Tab Navigation (`app/(tabs)/`)
| Dosya | Ekran | Açıklama |
|---|---|---|
| `index.tsx` | Gardırop | **Cover Flow carousel** — horizontal Animated.FlatList, 3D rotateY+scale |
| `outfits.tsx` | Kombin | Kombin listesi, sabit alt aksiyon barı (Manuel / Rastgele) |
| `calendar.tsx` | Takvim | Giyim takvimi |

### Modal / Stack Sayfalar
```
add-item.tsx              Yeni kıyafet ekleme (renk seçici dahil)
add-outfit.tsx            Rastgele kombin oluşturma
create-outfit-manual.tsx  Manuel kombin oluşturma
item/[id].tsx             Kıyafet detay + düzenleme
outfit/[id].tsx           Kombin detay + düzenleme
```

### Komponentler (`components/`)
```
ClothingCard.tsx              Kıyafet kartı (size="small"|"large", Reanimated press animasyonu)
OutfitCard.tsx                Kombin kartı (swipe-to-delete dahil)
ColorPicker.tsx               Renk seçici (bottom sheet)
EmptyState.tsx                Boş durum ekranı
ErrorBoundary.tsx / ErrorFallback.tsx
CategoryFilter.tsx
KeyboardAwareScrollViewCompat.tsx
```

### Context (`context/ClosetContext.tsx`)

**Tip tanımları:**
```typescript
type Season   = "spring" | "summer" | "fall" | "winter" | "all"  // TEK string
type Occasion = "casual" | "work" | "formal" | "sport" | "lounge" | "special"
type Category = "tops" | "bottoms" | "dresses" | "outerwear" | "shoes" |
                "accessories" | "bags" | "activewear" | "sleepwear" | "other"

interface ClosetItem {
  id, name, category, color, colorHex,  // colorHex: "#RRGGBB" formatı
  brand?, season, occasion, notes?,
  favorite, wearCount, lastWorn?, createdAt, updatedAt
}
```

**Depolama:** AsyncStorage — key'ler `@closet_items_v2`, `@closet_outfits_v2`
**Migration:** Eski `seasons: Season[]` (array) formatını `season: Season` (string) formatına dönüştürür.

### Renk Sistemi (`constants/colors.ts`)
```typescript
C.background          = "#F5F2EE"   // bej zemin
C.backgroundSecondary = "#FFFDFB"   // header arka planı
C.tint               = "#C9A96E"   // ana aksan rengi (sıcak altın)
C.cardBorder         = "#E8E2D9"
C.chip               = "#EDE8E2"
C.inputBackground    = "#F0EDE8"
C.text               = "#1A1A1A"
C.textSecondary      = "#6B6B6B"
C.textTertiary       = "#9E9E9E"
```

---

## Geliştirme Komutları

```bash
# Bağımlılıkları yükle
pnpm install

# API sunucusunu başlat
pnpm --filter @workspace/api-server dev

# Expo'yu başlat
pnpm --filter @workspace/mobile dev

# DB migration üret (lib/db klasöründe)
cd lib/db && pnpm drizzle-kit generate

# Tüm tip kontrolü
pnpm typecheck
```

---

## Çözülen Kritik Sorunlar

### 1. PostgreSQL → SQLite Geçişi
Şema dosyaları `pgTable` (drizzle-orm/pg-core) yerine `sqliteTable` (drizzle-orm/sqlite-core) kullanacak şekilde dönüştürüldü:
- `boolean` → `integer("col", { mode: "boolean" })`
- `timestamp().defaultNow()` → `text().default(sql\`CURRENT_TIMESTAMP\`)`

### 2. `better-sqlite3` → `@libsql/client`
Windows ortamında `better-sqlite3` native C++ derlemesi (node-gyp) başarısız oluyordu. `@libsql/client` WASM tabanlı olduğu için build gerektirmez. `lib/db/src/index.ts` ve tüm migrator referansları güncellendi.

### 3. "Table Already Exists" Hatası
`closet.ts` içindeki `initializeTable()` fonksiyonu ile `index.ts` içindeki `migrate()` çakışıyordu. Çözüm: her ikisi kaldırıldı, yerine `api-server/src/index.ts` içinde `CREATE TABLE IF NOT EXISTS` ile iki tablo için elle init yapılıyor.

### 4. `season` Tip Uyumsuzluğu
Backend tek `season: string` tutarken, eski `ClosetContext` `seasons: Season[]` (array) kullanıyordu. `ClosetContext.tsx` güncellenerek tek string forma geçildi. Migration fonksiyonu ile eski veriler dönüştürülüyor.

### 5. Windows `cross-env` Sorunu
`api-server` dev script'i `set NODE_ENV=development && tsx ...` şeklindeydi — CMD dışında çalışmıyor. `cross-env NODE_ENV=development tsx ...` olarak düzeltildi.

### 6. WheelColorPicker Feedback Loop (Siyah Renkler)
`react-native-wheel-color-picker`'a reactive state geçilince re-render döngüsüne girip thumb pozisyonu sıfırlanıyor, tüm custom renkler siyah kaydediliyordu. Çözüm:
- `wheelInitialColorRef = useRef(...)` — picker'a ref geçilir (re-render tetiklemez)
- `wheelPickerKey` state — modal her açıldığında `key` artırılır, picker yeniden mount edilir

---

## UI Özellikleri ve Tasarım Kararları

### Gardırop Sayfası (index.tsx) — Cover Flow Carousel
```
CARD_WIDTH  = SW × 0.628  ≈ 236pt @ 375pt  (iPhone 13 mini)
CARD_HEIGHT = CARD_WIDTH × 1.52  ≈ 359pt
GAP         = SW × 0.053  ≈ 20pt
ITEM_WIDTH  = CARD_WIDTH + GAP  (snap aralığı)
SIDE_INSET  = (SW - CARD_WIDTH) / 2  → her iki yanda ~49pt peek

Scroll pozisyonuna göre (useNativeDriver: true):
  rotateY:  45deg → 0deg → -45deg
  scale:    0.82  → 1.0  → 0.82
  opacity:  0.60  → 1.0  → 0.60
  perspective: 800 (sabit)
```
- `Animated.FlatList` kullanılır (FlatList + useNativeDriver uyumluluğu için zorunlu)
- `snapToInterval={ITEM_WIDTH}` + `decelerationRate="fast"` + `disableIntervalMomentum`
- Header (başlık + arama + kategori chip'leri) FlatList dışında sabit `View` olarak render edilir

### Kombin Sayfası (outfits.tsx)
- Manuel / Rastgele butonları header'da değil, tab bar'ın hemen üstünde sabit aksiyon barında
- Konum: `bottom = insets.bottom + TAB_BAR_HEIGHT(49) + 8`
- Liste bottom padding: `insets.bottom + 49 + ACTION_BAR_HEIGHT(68) + 24`

### Renk Seçici (add-item.tsx)
- Sabit palet + custom renk ekleme (WheelColorPicker)
- Custom renklere uzun basınca "Rengi Değiştir" / "Sil" action sheet
- Hex renk kodu yerine Türkçe insan-okunabilir isim gösterilir (`utils/colorName.ts`)
- `colorHex` alanı her zaman `#` prefix'i ile saklanır

### Türkçe Renk İsimleri (`utils/colorName.ts`)
`hexToColorName(hex)` fonksiyonu: Hex → RGB → HSL → Türkçe isim
Kapsam: ~40+ renk ismi (Lacivert, Hardal, Zümrüt, Leylak, Fuşya, Bordo, vb.) + Açık/Koyu/Pastel modifikasyonları

---

## Bilinen Sorunlar / Yapılacaklar

### Bilinen Sorunlar
1. **`ClothingCard.tsx` eski tip:** `item.seasons ?? []` kullanıyor (plural, array) — `season` (singular) ile güncellenmedi. Carousel'de `(item as any).season ?? item.seasons?.[0]` workaround'u var.
2. **`imageUri` henüz kullanılmıyor:** Şemada alan var, kart/liste ekranlarında fotoğraf gösterimi eklenmedi.
3. **API ↔ Mobile bağlantısı:** `ClosetContext` şu an API'yi outfits için çağırıyor ancak items local AsyncStorage'da tutuluyor. Tam senkronizasyon yapılmadı.
4. **Sadece light mode:** `Colors.dark` tanımlı değil, uygulama dark mode desteklemiyor.
5. **`item/[id].tsx` EditSheet:** `item.seasons ?? []` referansı var — `season` alanına güncellenmeli.

### Olası Geliştirmeler
- Kıyafet fotoğrafı yükleme (`imageUri` alanı hazır)
- Dark mode desteği
- Arama ve filtreleme geliştirilmesi (renk hex'e göre filtre)
- Outfit öneri algoritması iyileştirmesi
- Takvim ekranı geliştirmesi (haftalık/aylık görünüm)
- API ↔ mobile tam senkronizasyon

---

## Dosya Başvuru Haritası

| Ne arıyorsun | Nereye bak |
|---|---|
| DB bağlantısı | `lib/db/src/index.ts` |
| Tablo şemaları | `lib/db/src/schema/` |
| API route'ları | `artifacts/api-server/src/routes/` |
| Tüm tip tanımları | `artifacts/mobile/context/ClosetContext.tsx` |
| Renkler & kategoriler | `artifacts/mobile/constants/colors.ts` |
| Carousel (Cover Flow) | `artifacts/mobile/app/(tabs)/index.tsx` |
| Renk isim çevirisi | `artifacts/mobile/utils/colorName.ts` |
| Renk seçici mantığı | `artifacts/mobile/app/add-item.tsx` |
| Kombin sayfası | `artifacts/mobile/app/(tabs)/outfits.tsx` |
| Sunucu başlatma | `artifacts/api-server/src/index.ts` |
