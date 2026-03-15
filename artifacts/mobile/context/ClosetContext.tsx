import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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
  season: Season;
  occasion: Occasion;
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
  season: Season;
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

// ─── Context ──────────────────────────────────────────────────────────────────
const ClosetContext = createContext<ClosetContextType | null>(null);

export function ClosetProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from JSON storage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [itemsJson, outfitsJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_ITEMS),
          AsyncStorage.getItem(STORAGE_KEY_OUTFITS),
        ]);
        if (itemsJson) setItems(JSON.parse(itemsJson));
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
    await persistItems(
      items.map((i) => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i)
    );
  }, [items]);

  const deleteItem = useCallback(async (id: string) => {
    await persistItems(items.filter((i) => i.id !== id));
    await persistOutfits(
      outfits.map((o) => ({ ...o, itemIds: o.itemIds.filter((oid) => oid !== id) }))
    );
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
    const now = new Date().toISOString();
    const newOutfit: Outfit = { ...outfit, id: generateId(), createdAt: now, updatedAt: now };
    await persistOutfits([newOutfit, ...outfits]);
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
