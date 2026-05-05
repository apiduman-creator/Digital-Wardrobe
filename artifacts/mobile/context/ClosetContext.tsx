import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createOutfit as apiCreateOutfit } from "@workspace/api-client-react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export type Occasion = "casual" | "work" | "formal" | "sport" | "lounge" | "special";

export interface ClosetItem {
  id: string;
  name: string;
  category: Category;
  color: string;
  colorHex: string;
  brand?: string;
  season: Season;           // single season string — matches backend text field
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

// Migrate items from old array format (seasons: Season[]) to single-string format (season: Season)
function migrateItem(raw: any): ClosetItem {
  if (typeof raw.season === "string") return raw as ClosetItem;
  // Old format had `seasons` as an array — pick the first entry or default to "all"
  const arr: string[] = Array.isArray(raw.seasons) ? raw.seasons : [];
  const season: Season = (arr.length > 0 ? arr[0] : "all") as Season;
  const { seasons: _dropped, ...rest } = raw;
  return { ...rest, season } as ClosetItem;
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
    const nextItems = items.filter((i) => i.id !== id);
    const nextOutfits = outfits.map((o) => ({
      ...o,
      itemIds: o.itemIds.filter((oid) => oid !== id),
    }));
    await AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(nextItems));
    await AsyncStorage.setItem(STORAGE_KEY_OUTFITS, JSON.stringify(nextOutfits));
    setItems(nextItems);
    setOutfits(nextOutfits);
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
  const addOutfit = useCallback(async (outfit: Omit<Outfit, "id" | "createdAt" | "updatedAt">) => {
    try {
      const created = await apiCreateOutfit({
        name: outfit.name,
        itemIds: outfit.itemIds,
        occasion: outfit.occasion,
        season: outfit.season,
        notes: outfit.notes,
        favorite: outfit.favorite,
      });
      if (!created || !created.id) {
        throw new Error("API returned empty outfit response");
      }
      const normalized: Outfit = {
        id: created.id,
        name: created.name,
        itemIds: created.itemIds,
        occasion: created.occasion as Occasion,
        season: created.season as Season,
        notes: created.notes,
        favorite: created.favorite,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
      await persistOutfits([normalized, ...outfits]);
    } catch (e) {
      console.error("Failed to create outfit via API, falling back to local:", e);
      const now = new Date().toISOString();
      const fallback: Outfit = { ...outfit, id: generateId(), createdAt: now, updatedAt: now };
      await persistOutfits([fallback, ...outfits]);
    }
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
