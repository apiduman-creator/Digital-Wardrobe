import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CalendarEntry {
  date: string;        // "YYYY-MM-DD"
  outfitId?: string;
  outfitName?: string;
  itemIds: string[];
  note?: string;
}

interface CalendarContextType {
  entries: Record<string, CalendarEntry>;  // keyed by "YYYY-MM-DD"
  logEntry: (date: string, data: Omit<CalendarEntry, "date">) => Promise<void>;
  removeEntry: (date: string) => Promise<void>;
  getEntry: (date: string) => CalendarEntry | undefined;
}

const STORAGE_KEY = "@closet_calendar_v1";

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

  const removeEntry = useCallback(async (date: string) => {
    const next = { ...entries };
    delete next[date];
    await persist(next);
  }, [entries]);

  const getEntry = useCallback((date: string) => entries[date], [entries]);

  return (
    <CalendarContext.Provider value={{ entries, logEntry, removeEntry, getEntry }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): CalendarContextType {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}
