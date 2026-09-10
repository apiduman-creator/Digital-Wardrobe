# Yapılacaklar — Canlı Backlog

> Bu dosya **her session sonunda güncellenmeli**. Projenin tek doğru durum kaynağı burasıdır.
> Son güncelleme: 09 Eylül 2026

---

## 🔴 App Store'a Çıkmak İçin Zorunlu

- [x] **Privacy policy** — `docs/index.html` olarak yazıldı, GitHub Pages'te yayında: `https://apiduman-creator.github.io/Digital-Wardrobe/`. Apple 5.1.1, KVKK Aydınlatma unsurları ve Anthropic/Claude API açıklaması dahil.
- [x] **iOS kamera/galeri izin metinleri** — `app.json` → `ios.infoPlist` içine `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` eklendi (jenerik değil, özellik bazlı metin).
- [x] **AI açık rıza ekranı (KVKK + Apple 5.1.1 uyumu)** — Onboarding'e yeni "ai_consent" adımı eklendi (checkbox + "Devam Et"); `add-item.tsx`'e de aynı `ai_consent_given` AsyncStorage bayrağını kontrol eden bir güvenlik-ağı Alert'i eklendi (onboarding'den önce kurulu kullanıcılar için). Test edildi, çalışıyor.
- [ ] **iOS production build** — `eas build --platform ios --profile production`. Apple Developer enrollment tamam, credentials (distribution certificate + provisioning profile) EAS'ta oluşturuldu.
  - ⚠️ **AÇIK SORUN:** Build şu hata ile başarısız oluyor: `cannot find 'ExpoAppDelegate' in scope` (Xcode/fastlane aşamasında). Bilinen sebep: pnpm monorepo + Expo native autolinking uyumsuzluğu.
  - Denenen çözüm: `.npmrc`'ye `node-linker=hoisted` + hoist pattern'leri eklendi (Expo'nun resmi monorepo dokümantasyonunda önerilen standart çözüm) → bu, **local'de** Expo Router'ı bozdu (`EXPO_ROUTER_APP_ROOT` / `require.context` hatası, muhtemelen `EXPO_ROUTER_APP_ROOT=./app` ile `.env`'de elle set edilerek çözülebilirdi ama zaman kalmadı) → değişiklik **geri alındı**, local tekrar sağlıklı çalışıyor.
  - **Sıradaki adım (bir sonraki session):** `node-linker=hoisted` çözümünü tekrar dene, bu sefer `EXPO_ROUTER_APP_ROOT=./app` değerini `.env`'e ekleyerek birlikte uygula. Ya da alternatif: hoisted ayarını sadece EAS build ortamına özgü yapmanın bir yolu var mı araştır (local'i hiç etkilemeden).
- [ ] **TestFlight'a yükleme** — `eas submit`. (iOS build sorunu çözülmeden yapılamaz.)
- [ ] **App Store Connect** — uygulama açıklaması, ekran görüntüleri, kategori, yaş sınırı, App Privacy formu (Photos/Videos → App Functionality → not linked → not tracking olarak işaretlenecek). Henüz başlanmadı.

## 🟠 Monetizasyon (kullanıcının yeni önceliği)

- [ ] **RevenueCat entegrasyonu** — `react-native-purchases`, iOS IAP. ~2-3 sa
- [ ] **Freemium sınırı** — ilk 5 AI tarama ücretsiz, sayaç tutulmalı. ~1 sa
- [ ] **Paywall ekranı** — Atelier Couture diline uygun tasarım. ~1-2 sa
- [ ] Fiyat modeli kesinleştir — abonelik mi, paket mi, ikisi mi? (bkz. `03-URUN-STRATEJISI.md`)

## 🟡 Yeni Özellik: AI Kombin Önerisi

- [ ] **Backend endpoint** — gardıroptaki kıyafetleri alıp renk uyumu + mevsim + stil (Minimalist / Streetwear / Business Casual) baz alarak kombin önerisi döndürür. ~1 sa
  - Maliyet: öneri başına ~500-800 token ≈ **$0.002**
- [ ] **Mobile öneri ekranı** — ~2-3 sa
- [ ] Premium'a bağla

## 🟡 Yarım Kalan Altyapı

- [ ] **Backend auth + veri taşıma** (ikisi birlikte yapılmalı, tek başına auth'un faydası yok) ~3-4 sa
  - Mobile'a kayıt/giriş ekranı
  - Token AsyncStorage'da saklanacak
  - Her API isteğine `Authorization: Bearer` eklenecek
  - Token expire yenileme mekanizması
  - Closet/outfit verileri AsyncStorage'dan backend'e taşınacak
  - `routes/index.ts` içinde `/closet` ve `/outfits` üzerine `authMiddleware` **geri eklenecek**
- [ ] **Kombinler sayfası görsel iyileştirme** — kartlar hâlâ sade, görsel yok. ~1 sa
- [ ] **Takvim güçlendirmesi** — giyilen kıyafetin rengi/fotoğrafı takvimde görünsün. ~1-2 sa

## 🟢 Sonraya / MVP Sonrası

- [ ] Seed data (demo kıyafetler)
- [ ] Push notification — "Bugün ne giyeceksin?"
- [ ] Maskot animasyonları (cilalama sprintinde)
- [ ] Affiliate modeli — marka tanınınca alışveriş butonu
- [ ] Görsel içerik moderasyonu (uygunsuz fotoğraf kontrolü)
- [ ] Android build + Play Store
- [ ] `outfits.item_ids` → ayrı `outfit_items` junction tablosu (teknik borç)
- [ ] `ColorSelector` component'indeki `defaultSizing` artık hiçbir yerden çağrılmıyor (her iki ekran da `size="compact"` kullanıyor) — ileride ya kaldırılıp `size` prop'u sadeleştirilmeli, ya da üçüncü bir kullanım yeri çıkarsa saklanmalı.

---

## ✅ Tamamlananlar (arşiv)

### 09 Eylül 2026 session'ı
- [x] **Renk seçici kartela redesign — TAMAMEN BİTTİ (3 adım):**
  1. Dil tutarlılığı: preset renkler artık sabit Türkçe isim (`constants/colors.ts`'teki `nameTr` alanı), custom renkler `hexToColorName` ile Türkçe; kaydedilen `colorLabel` de artık Türkçe.
  2. Kod birleştirme: `add-item.tsx` + `item/[id].tsx`'teki tekrarlanan renk seçici mantığı (grid + wheel picker + custom renk CRUD + long-press menü) ortak `components/ColorSelector.tsx` component'ine taşındı (`size` prop'uyla default/compact iki boyut destekleniyor, AI foto analizi sonrası key-remount ile renk otomatik senkron oluyor). Eski ölü `components/ColorPicker.tsx` silindi.
  3. Bottom sheet UX'i: form üzerinde artık sadece tıklanabilir bir önizleme satırı (dot + renk adı) var; dokununca ızgara + özel renk ekleme bir "kartela" (bottom sheet modal) içinde açılıyor, "Tamam" butonuyla kapatılıyor, çoklu renk seçimi (2 renk + rainbow) destekleniyor. Wheel picker ve long-press action sheet modalları, iOS'un iç içe modal davranışına uygun şekilde kartela modalının içine nested olarak taşındı.
- [x] Kıyafet silme: yetim fotoğraf dosyası artık `FileSystem.deleteAsync` ile temizleniyor (`ClosetContext.deleteItem`).
- [x] Fotoğraf ekleme akışı düzeltildi: `manipulateAsync`'teki width+height birlikte verilme hatası (oran bozan sıkıştırma) giderildi, `allowsEditing` + `aspect:[25,22]` (Gardırop ana ekranındaki carousel kartının gerçek oranı) ile native kırpma ekranı (ızgaralı) eklendi.
- [x] Build 20→24, hepsi TestFlight'ta test edildi ve doğrulandı.
- [x] **App Store Connect ekran görüntüleri artık blocker'sız** — kartela bittiği için ekran görüntüsü almaya başlanabilir.

### Kod tabanı temizliği
- [x] PostgreSQL şeması → SQLite (`pgTable` → `sqliteTable`)
- [x] `better-sqlite3` → `@libsql/client` (Windows native build sorunu)
- [x] `closet.ts` içindeki bozuk import sırası düzeltildi
- [x] `cross-env` ile Windows-only `set NODE_ENV` script'i düzeltildi
- [x] `seasons` (dizi) / `season` (string) tip uyumsuzluğu hizalandı
- [x] Drizzle migrate ↔ `initializeTable()` çakışması çözüldü

### Güvenlik sprinti
- [x] API key backend'e taşındı
- [x] Strike sistemi (server-side, 3 strike → 24 saat blok)
- [x] Rate limiting (global 100/dk, analyze 10/dk)
- [x] Fotoğraf boyutu limiti (5MB)
- [x] Input validation (name 100 / brand 50 / notes 500)
- [x] Analiz öncesi onay dialogu
- [x] `express.json` limiti 10mb'a çıkarıldı

### Özellikler
- [x] AI ile fotoğraf tanıma (Claude Vision)
- [x] Fotoğraf optimizasyonu (800x800, q0.4 → 5x token tasarrufu)
- [x] Fotoğrafların cihazda saklanması (expo-file-system)
- [x] Kıyafet durum etiketleri
- [x] Cover Flow carousel ana sayfa
- [x] Onboarding akışı
- [x] Türkçeleştirme

### Tasarım
- [x] Renk picker feedback loop bug'ı (siyah daire sorunu)
- [x] Hex → Türkçe renk isimleri (HSL algoritması)
- [x] Custom renklere long press menüsü
- [x] Maskot karakter tasarımı + 14 görsel
- [x] Atelier Couture yeniden tasarımı
- [x] Header standardizasyonu (3 sekme identik)
- [x] Kombinler butonları alt bara taşındı
- [x] App ikonu + splash screen

### Deployment
- [x] Render'a deploy
- [x] UptimeRobot monitörü
- [x] EAS Build yapılandırması
- [x] Apple Developer hesabı + enrollment
