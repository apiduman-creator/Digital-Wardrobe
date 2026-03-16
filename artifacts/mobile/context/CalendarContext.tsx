import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CalendarEntry {
  date: string;            // "YYYY-MM-DD"
  outfitId?: string;
  outfitName?: string;
  itemIds: string[];       // all items worn that day
  itemNames?: Record<string, string>;  // itemId → name lookup
  note?: string;
}

interface CalendarContextType {
  entries: Record<string, CalendarEntry>;
  // Log a full outfit to a date
  logEntry: (date: string, data: Omit<CalendarEntry, "date">) => Promise<void>;
  // Log a single worn item to today — merges into existing entry
  logWornItem: (itemId: string, itemName: string) => Promise<void>;
  // Remove a single item from today's entry
  removeWornItem: (date: string, itemId: string) => Promise<void>;
  removeEntry: (date: string) => Promise<void>;
  getEntry: (date: string) => CalendarEntry | undefined;
}

const STORAGE_KEY = "@closet_calendar_v1";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const CalendarContext = createContext<CalendarContextType | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, CalendarEntry>>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) setEntries(JSON.parse(json));
    });
  }, []);

  const persist = async (next: Record<string, CalendarEntry>) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setEntries(next);
  };

  const logEntry = useCallback(async (date: string, data: Omit<CalendarEntry, "date">) => {
    await persist({ ...entries, [date]: { ...data, date } });
  }, [entries]);

  // Merge a single worn item into today's date entry
  const logWornItem = useCallback(async (itemId: string, itemName: string) => {
    const date = todayKey();
    const existing = entries[date];
    const prevIds: string[] = existing?.itemIds ?? [];
    const prevNames: Record<string, string> = existing?.itemNames ?? {};

    // Avoid duplicating the same item on the same day
    if (prevIds.includes(itemId)) return;

    const next: CalendarEntry = {
      ...(existing ?? { date }),
      date,
      itemIds: [...prevIds, itemId],
      itemNames: { ...prevNames, [itemId]: itemName },
    };
    await persist({ ...entries, [date]: next });
  }, [entries]);

  const removeWornItem = useCallback(async (date: string, itemId: string) => {
    const existing = entries[date];
    if (!existing) return;
    const nextIds = existing.itemIds.filter((id) => id !== itemId);
    if (nextIds.length === 0) {
      // Remove the whole entry if no items left
      const next = { ...entries };
      delete next[date];
      await persist(next);
    } else {
      const nextNames = { ...(existing.itemNames ?? {}) };
      delete nextNames[itemId];
      await persist({ ...entries, [date]: { ...existing, itemIds: nextIds, itemNames: nextNames } });
    }
  }, [entries]);

  const removeEntry = useCallback(async (date: string) => {
    const next = { ...entries };
    delete next[date];
    await persist(next);
  }, [entries]);

  const getEntry = useCallback((date: string) => entries[date], [entries]);

  return (
    <CalendarContext.Provider value={{ entries, logEntry, logWornItem, removeWornItem, removeEntry, getEntry }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): CalendarContextType {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}
