import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

// ─── Domain Types ────────────────────────────────────────────────────────────
export type Category =
  | "tops"
  | "bottoms"
  | "dresses"
  | "outerwear"
  | "shoes"
  | "accessories"
  | "bags"
  | "activewear"
  | "sleepwear"
  | "other";

export type Season = "spring" | "summer" | "fall" | "winter" | "all";

// Kombin üretme/filtreleme ekranlarında kullanılan mevsim seçimi ("all" dahil).
export type OutfitSeason = Season;

// Bir kıyafete atanabilecek gerçek mevsimler ("all" = dördü birden).
export const ALL_ITEM_SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

export type Occasion = "casual" | "work" | "formal" | "sport" | "lounge" | "special";

export interface ClosetItem {
  id: string;
  name: string;
  category: Category;
  color: string;
  colorHex: string;
  brand?: string;
  seasons: Season[];        // çoklu mevsim — ekle/düzenle ekranları ve AI analizi dizi üretiyor
  occasion: string;         // JSON stringified Occasion[] e.g. '["casual","work"]'
  imageUri?: string;        // local file:// URI stored in documentDirectory
  status?: "ready" | "dirty" | "washing" | "dry-cleaning";
  notes?: string;
  favorite: boolean;
  wearCount: number;
  lastWorn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  occasion: Occasion;
  season: Season;          // single season filter for outfit generation
  notes?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Context Interface ────────────────────────────────────────────────────────
interface ClosetContextType {
  items: ClosetItem[];
  outfits: Outfit[];
  loading: boolean;
  addItem: (item: Omit<ClosetItem, "id" | "createdAt" | "updatedAt" | "wearCount">) => Promise<void>;
  updateItem: (id: string, updates: Partial<ClosetItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  logWear: (id: string) => Promise<void>;
  addOutfit: (outfit: Omit<Outfit, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateOutfit: (id: string, updates: Partial<Outfit>) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
  toggleOutfitFavorite: (id: string) => Promise<void>;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const STORAGE_KEY_ITEMS = "@closet_items_v2";
const STORAGE_KEY_OUTFITS = "@closet_outfits_v2";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Mevsim alanını tek doğru biçime (seasons: Season[]) normalize eder.
// Geçmişte tip tekil `season` stringe çevrilmiş ama ekranlar `seasons`
// dizisi yazmaya devam etmişti; eski migration her açılışta diziyi silip
// sadece ilk mevsimi bırakıyordu (mevsim bilgisi kayboluyor, detayda "—"
// görünüyor, kombin üretirken mevsim seçilince çöküyordu — 2026-10-25).
// Artık: dizi varsa korunur; sadece eski tekil `season` varsa diziye çevrilir.
// Ayrıca imageUri'yi HER YÜKLEMEDE güncel
// documentDirectory değeriyle yeniden inşa eder — iOS, uygulama
// güncellemeleri arasında bu klasörün adresini (container UUID)
// değiştirebiliyor; dosyanın kendisi kaybolmuyor ama eski, donmuş yol
// artık geçersiz kalıyor. Bu "kendi kendini onaran" adım olmadan,
// normal bir TestFlight/App Store güncellemesi sonrası kullanıcı
// fotoğraflarının "kaybolmuş" görünmesine sebep oluyordu (kök sebep
// bulundu, 2026-09-08).
function fixImageUri(imageUri: string | undefined): string | undefined {
  if (!imageUri) return imageUri;
  const marker = "closet-photos/";
  const idx = imageUri.indexOf(marker);
  if (idx === -1) return imageUri; // beklenmedik format, dokunma
  const relativePart = imageUri.slice(idx); // "closet-photos/1736280000000.jpg"
  return `${FileSystem.documentDirectory}${relativePart}`;
}

function normalizeSeasons(raw: any): Season[] {
  if (Array.isArray(raw.seasons) && raw.seasons.length > 0) {
    return raw.seasons as Season[];
  }
  if (typeof raw.season === "string" && raw.season !== "all") {
    return [raw.season as Season];
  }
  // "all", boş ya da hiç yoksa: dört mevsim
  return [...ALL_ITEM_SEASONS];
}

function migrateItem(raw: any): ClosetItem {
  const { season: _legacySeason, ...rest } = raw;
  return {
    ...rest,
    seasons: normalizeSeasons(raw),
    imageUri: fixImageUri(raw.imageUri),
  } as ClosetItem;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ClosetContext = createContext<ClosetContextType | null>(null);

export function ClosetProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [itemsJson, outfitsJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_ITEMS),
          AsyncStorage.getItem(STORAGE_KEY_OUTFITS),
        ]);
        if (itemsJson) {
          const parsed: any[] = JSON.parse(itemsJson);
          setItems(parsed.map(migrateItem));
        }
        if (outfitsJson) setOutfits(JSON.parse(outfitsJson));
      } catch (e) {
        console.error("Failed to load closet data:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const persistItems = async (next: ClosetItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(next));
    setItems(next);
  };

  const persistOutfits = async (next: Outfit[]) => {
    await AsyncStorage.setItem(STORAGE_KEY_OUTFITS, JSON.stringify(next));
    setOutfits(next);
  };

  // ─── Item Operations ────────────────────────────────────────────────────────
  const addItem = useCallback(async (
    item: Omit<ClosetItem, "id" | "createdAt" | "updatedAt" | "wearCount">
  ) => {
    const now = new Date().toISOString();
    const newItem: ClosetItem = { ...item, id: generateId(), wearCount: 0, createdAt: now, updatedAt: now };
    await persistItems([newItem, ...items]);
  }, [items]);

  const updateItem = useCallback(async (id: string, updates: Partial<ClosetItem>) => {
    const next = items.map((i) =>
      i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
    );
    await persistItems(next);
  }, [items]);

  const deleteItem = useCallback(async (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    const nextItems = items.filter((i) => i.id !== id);
    const nextOutfits = outfits.map((o) => ({
      ...o,
      itemIds: o.itemIds.filter((oid) => oid !== id),
    }));
    await AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(nextItems));
    await AsyncStorage.setItem(STORAGE_KEY_OUTFITS, JSON.stringify(nextOutfits));
    setItems(nextItems);
    setOutfits(nextOutfits);

    // Fiziksel fotoğraf dosyasını temizle — bu ikincil bir iyileştirme,
    // başarısız olsa bile kayıt silme işlemini engellemez.
    const imageUri = fixImageUri(itemToDelete?.imageUri);
    if (imageUri) {
      try {
        await FileSystem.deleteAsync(imageUri, { idempotent: true });
      } catch (e) {
        console.error("Failed to delete item photo:", e);
      }
    }
  }, [items, outfits]);

  const toggleFavorite = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) await updateItem(id, { favorite: !item.favorite });
  }, [items, updateItem]);

  const logWear = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) await updateItem(id, {
      wearCount: item.wearCount + 1,
      lastWorn: new Date().toISOString(),
    });
  }, [items, updateItem]);

  // ─── Outfit Operations ──────────────────────────────────────────────────────
  // v1.0: kombinler de kıyafetler gibi SADECE cihazda (AsyncStorage) tutulur.
  // Önceden burada kimlik doğrulamasız bir POST /outfits çağrısı vardı — veri
  // Render'ın kalıcı olmayan diskine, kullanıcıyla ilişkilendirilmeden
  // yazılıyordu. Backend senkronizasyonu v1.1'de (Turso + hesap) gelecek.
  const addOutfit = useCallback(async (outfit: Omit<Outfit, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const created: Outfit = { ...outfit, id: generateId(), createdAt: now, updatedAt: now };
    await persistOutfits([created, ...outfits]);
  }, [outfits]);

  const updateOutfit = useCallback(async (id: string, updates: Partial<Outfit>) => {
    await persistOutfits(
      outfits.map((o) => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o)
    );
  }, [outfits]);

  const deleteOutfit = useCallback(async (id: string) => {
    await persistOutfits(outfits.filter((o) => o.id !== id));
  }, [outfits]);

  const toggleOutfitFavorite = useCallback(async (id: string) => {
    const outfit = outfits.find((o) => o.id === id);
    if (outfit) await updateOutfit(id, { favorite: !outfit.favorite });
  }, [outfits, updateOutfit]);

  return (
    <ClosetContext.Provider value={{
      items, outfits, loading,
      addItem, updateItem, deleteItem, toggleFavorite, logWear,
      addOutfit, updateOutfit, deleteOutfit, toggleOutfitFavorite,
    }}>
      {children}
    </ClosetContext.Provider>
  );
}

export function useCloset(): ClosetContextType {
  const ctx = useContext(ClosetContext);
  if (!ctx) throw new Error("useCloset must be used within ClosetProvider");
  return ctx;
}
