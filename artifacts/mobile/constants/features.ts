// ─── Özellik bayrakları ───────────────────────────────────────────────────────
//
// ACCOUNTS_ENABLED — v1.0'da hesap (kayıt/giriş) özelliği KAPALI.
// Neden:
//   1. Gardırop verisi henüz backend'e taşınmıyor; hesap açmak kullanıcıya
//      şu an hiçbir fayda sağlamıyor ("buluta yedeklenir" vaadi doğru olmazdı).
//   2. Render'ın ücretsiz diski deploy'da sıfırlanabiliyor — hesaplar kaybolabilir.
//   3. Apple 5.1.1(v): uygulamada hesap açılabiliyorsa, hesap silme de uygulama
//      içinden başlatılabilmeli. Bu henüz yok.
// v1.1'de Turso + tek seferlik migration + hesap silme ile birlikte true yapılacak.
// Kod (auth.tsx, AuthContext, onboarding'deki account_invite adımı) silinmedi,
// sadece bu bayrakla gizlendi.
export const ACCOUNTS_ENABLED = false;
