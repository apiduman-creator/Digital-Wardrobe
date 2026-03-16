import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useCalendar, CalendarEntry } from "@/context/CalendarContext";
import { useCloset } from "@/context/ClosetContext";

const DAYS_SHORT = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey(): string {
  const d = new Date();
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function entryDisplayName(entry: CalendarEntry): string {
  if (entry.outfitName) return entry.outfitName;
  if (entry.itemNames) {
    const names = Object.values(entry.itemNames);
    if (names.length === 1) return names[0];
    if (names.length > 1) return `${names[0]} +${names.length - 1} parça`;
  }
  if (entry.itemIds.length > 0) return `${entry.itemIds.length} parça giyildi`;
  return "Kayıt";
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────
function DayCell({
  day, dateKey, isToday, isSelected, hasEntry, entryColors, onPress,
}: {
  day: number | null; dateKey: string; isToday: boolean; isSelected: boolean;
  hasEntry: boolean; entryColors: string[]; onPress: () => void;
}) {
  const C = Colors.light;
  if (!day) return <View style={styles.dayCellEmpty} />;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dayCell,
        isSelected && { backgroundColor: C.tint },
        isToday && !isSelected && { borderWidth: 1.5, borderColor: C.tint },
      ]}
    >
      <Text style={[styles.dayNumber, { color: isSelected ? "#FFF" : isToday ? C.tint : C.text }]}>
        {day}
      </Text>
      {hasEntry && (
        <View style={styles.dotRow}>
          {entryColors.slice(0, 3).map((hex, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: isSelected ? "rgba(255,255,255,0.8)" : hex }]} />
          ))}
        </View>
      )}
    </Pressable>
  );
}

// ─── Day Detail Modal ─────────────────────────────────────────────────────────
function DayDetailModal({
  visible, dateKey, onClose,
}: {
  visible: boolean; dateKey: string; onClose: () => void;
}) {
  const C = Colors.light;
  const { outfits, items } = useCloset();
  const { logEntry, getEntry, removeEntry, removeWornItem } = useCalendar();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const existing = getEntry(dateKey);

  const [y, mo, d] = dateKey.split("-").map(Number);
  const displayDate = `${d} ${MONTHS_TR[mo - 1]} ${y}`;

  const handleSelectOutfit = async (outfitId: string) => {
    const outfit = outfits.find((o) => o.id === outfitId);
    if (!outfit) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logEntry(dateKey, {
      outfitId: outfit.id,
      outfitName: outfit.name,
      itemIds: outfit.itemIds,
    });
    onClose();
  };

  const handleRemoveEntry = async () => {
    await removeEntry(dateKey);
    setConfirmRemove(false);
    onClose();
  };

  const getItemColors = (ids: string[]) =>
    ids.map((id) => items.find((i) => i.id === id)?.colorHex).filter(Boolean) as string[];

  // Worn items from "Bugün Giydim" (individual items not from outfit)
  const wornItems = (existing?.itemIds ?? [])
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean) as typeof items;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.modalSheet, { backgroundColor: C.backgroundSecondary }]} onStartShouldSetResponder={() => true}>
          <View style={[styles.handle, { backgroundColor: C.separator }]} />
          <Text style={[styles.modalTitle, { color: C.text }]}>{displayDate}</Text>

          {/* Show current entry */}
          {existing && (
            <View style={[styles.currentEntryCard, { backgroundColor: C.chip, borderColor: C.cardBorder }]}>
              <View style={styles.currentEntryTop}>
                <View style={styles.currentEntryLeft}>
                  <Feather name="check-circle" size={15} color={C.tint} />
                  <Text style={[styles.currentEntryName, { color: C.text }]} numberOfLines={1}>
                    {entryDisplayName(existing)}
                  </Text>
                </View>
                {!confirmRemove && (
                  <Pressable onPress={() => setConfirmRemove(true)} hitSlop={8}>
                    <Feather name="trash-2" size={15} color={C.destructive} />
                  </Pressable>
                )}
              </View>

              {confirmRemove && (
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmText, { color: C.textSecondary }]}>Kaydı sil?</Text>
                  <Pressable onPress={() => setConfirmRemove(false)} style={[styles.confirmBtn, { backgroundColor: C.separator }]}>
                    <Text style={[styles.confirmBtnText, { color: C.textSecondary }]}>İptal</Text>
                  </Pressable>
                  <Pressable onPress={handleRemoveEntry} style={[styles.confirmBtn, { backgroundColor: C.destructive }]}>
                    <Text style={[styles.confirmBtnText, { color: "#FFF" }]}>Sil</Text>
                  </Pressable>
                </View>
              )}

              {/* Worn items dots */}
              {wornItems.length > 0 && (
                <View style={styles.wornItemsRow}>
                  {wornItems.map((item) => (
                    <View key={item.id} style={[styles.wornItemChip, { backgroundColor: item.colorHex ?? "#CCC" }]}>
                      <Text style={{ fontSize: 10, color: "#FFF", fontFamily: "Inter_500Medium" }} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Outfit picker */}
          <Text style={[styles.modalSubtitle, { color: C.textSecondary }]}>
            {existing ? "Farklı kombin seç" : "Hangi kombini giydini?"}
          </Text>

          {outfits.length === 0 ? (
            <View style={styles.emptyPicker}>
              <Feather name="layers" size={28} color={C.textTertiary} />
              <Text style={[styles.emptyPickerText, { color: C.textSecondary }]}>
                Henüz kayıtlı kombin yok.{"\n"}Kombins sekmesinden oluşturun.
              </Text>
            </View>
          ) : (
            <FlatList
              data={outfits}
              keyExtractor={(o) => o.id}
              style={styles.outfitList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: outfit }) => {
                const colors = getItemColors(outfit.itemIds);
                const isCurrentlySelected = existing?.outfitId === outfit.id;
                return (
                  <Pressable
                    onPress={() => handleSelectOutfit(outfit.id)}
                    style={[
                      styles.outfitRow,
                      { backgroundColor: isCurrentlySelected ? C.chip : C.card, borderColor: isCurrentlySelected ? C.tint : C.cardBorder },
                    ]}
                  >
                    <View style={styles.outfitColorDots}>
                      {colors.slice(0, 4).map((hex, i) => (
                        <View key={i} style={[styles.outfitColorDot, { backgroundColor: hex }]} />
                      ))}
                    </View>
                    <View style={styles.outfitInfo}>
                      <Text style={[styles.outfitName, { color: C.text }]}>{outfit.name}</Text>
                      <Text style={[styles.outfitMeta, { color: C.textSecondary }]}>{outfit.occasion} · {outfit.season}</Text>
                    </View>
                    {isCurrentlySelected && <Feather name="check" size={18} color={C.tint} />}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { entries } = useCalendar();
  const { items } = useCloset();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const getEntryColors = useCallback((dateKey: string): string[] => {
    const entry = entries[dateKey];
    if (!entry) return [];
    const allIds = entry.itemIds ?? [];
    const colors = allIds
      .map((id) => items.find((i) => i.id === id)?.colorHex)
      .filter(Boolean) as string[];
    if (colors.length > 0) return colors;
    // Fallback: use a generic tint dot if entry exists but no items match
    return [C.tint];
  }, [entries, items, C.tint]);

  const handleDayPress = (day: number) => {
    const dateKey = toDateKey(year, month, day);
    setSelectedDate(dateKey);
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setPickerVisible(true);
  };

  const loggedList = useMemo(() => {
    return Object.values(entries)
      .filter((e) => {
        const [y, m] = e.date.split("-").map(Number);
        return y === year && m === month + 1;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, year, month]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <View>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>Giyim</Text>
            <Text style={[styles.title, { color: C.text }]}>Takvimi</Text>
          </View>
        </View>

        {/* Month Navigator */}
        <View style={[styles.monthNav, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
          <Pressable onPress={prevMonth} style={styles.navBtn} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={C.text} />
          </Pressable>
          <Text style={[styles.monthTitle, { color: C.text }]}>{MONTHS_TR[month]} {year}</Text>
          <Pressable onPress={nextMonth} style={styles.navBtn} hitSlop={8}>
            <Feather name="chevron-right" size={22} color={C.text} />
          </Pressable>
        </View>

        {/* Day Headers */}
        <View style={[styles.dayHeaders, { backgroundColor: C.card }]}>
          {DAYS_SHORT.map((d) => (
            <Text key={d} style={[styles.dayHeader, { color: C.textTertiary }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={[styles.calendarGrid, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
          {calendarDays.map((day, index) => {
            const dateKey = day ? toDateKey(year, month, day) : "";
            const hasEntry = !!entries[dateKey];
            const entryColors = day ? getEntryColors(dateKey) : [];
            const isToday = dateKey === todayKey();
            const isSelected = dateKey === selectedDate;
            return (
              <DayCell
                key={index} day={day} dateKey={dateKey} isToday={isToday}
                isSelected={isSelected} hasEntry={hasEntry} entryColors={entryColors}
                onPress={() => day && handleDayPress(day)}
              />
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.tint }]} />
            <Text style={[styles.legendText, { color: C.textSecondary }]}>Kıyafet giyildi</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { borderWidth: 1.5, borderColor: C.tint, backgroundColor: "transparent" }]} />
            <Text style={[styles.legendText, { color: C.textSecondary }]}>Bugün</Text>
          </View>
        </View>

        {/* Monthly Log */}
        {loggedList.length > 0 && (
          <View style={styles.logSection}>
            <Text style={[styles.logTitle, { color: C.textSecondary }]}>
              {MONTHS_TR[month]} Giyim Geçmişi
            </Text>
            {loggedList.map((entry) => {
              const [, m, d] = entry.date.split("-").map(Number);
              const colors = getEntryColors(entry.date);
              const label = entryDisplayName(entry);
              return (
                <Pressable
                  key={entry.date}
                  onPress={() => { setSelectedDate(entry.date); setPickerVisible(true); }}
                  style={[styles.logRow, { backgroundColor: C.card, borderColor: C.cardBorder }]}
                >
                  <View style={[styles.logDateBox, { backgroundColor: C.chip }]}>
                    <Text style={[styles.logDay, { color: C.tint }]}>{d}</Text>
                    <Text style={[styles.logMonth, { color: C.textSecondary }]}>{MONTHS_TR[m - 1].slice(0, 3)}</Text>
                  </View>
                  <View style={styles.logInfo}>
                    <Text style={[styles.logOutfitName, { color: C.text }]} numberOfLines={1}>{label}</Text>
                    <View style={styles.logColors}>
                      {colors.slice(0, 5).map((hex, i) => (
                        <View key={i} style={[styles.logColorDot, { backgroundColor: hex }]} />
                      ))}
                    </View>
                  </View>
                  <View style={styles.logSource}>
                    <Feather
                      name={entry.outfitId ? "layers" : "tag"}
                      size={13}
                      color={C.textTertiary}
                    />
                    <Text style={[styles.logSourceText, { color: C.textTertiary }]}>
                      {entry.outfitId ? "Kombin" : "Ürün"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {loggedList.length === 0 && (
          <View style={styles.emptyLog}>
            <Feather name="calendar" size={28} color={C.textTertiary} />
            <Text style={[styles.emptyLogText, { color: C.textSecondary }]}>
              Bu ay için giyim kaydı yok.{"\n"}
              Bir güne tıklayın veya ürün detayından{"\n"}
              <Text style={{ fontFamily: "Inter_600SemiBold" }}>"Bugün Giydim"</Text> butonunu kullanın.
            </Text>
          </View>
        )}
      </ScrollView>

      {selectedDate && (
        <DayDetailModal
          visible={pickerVisible}
          dateKey={selectedDate}
          onClose={() => setPickerVisible(false)}
        />
      )}
    </View>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  title: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  navBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  dayHeaders: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 6 },
  dayHeader: { flex: 1, textAlign: "center", fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.3 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 16, borderRadius: 16, borderWidth: 1, overflow: "hidden", paddingVertical: 8 },
  dayCell: { width: `${100 / 7}%`, height: CELL_SIZE, alignItems: "center", justifyContent: "center", borderRadius: 10, gap: 2 },
  dayCellEmpty: { width: `${100 / 7}%`, height: CELL_SIZE },
  dayNumber: { fontSize: 14, fontFamily: "Inter_500Medium" },
  dotRow: { flexDirection: "row", gap: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legendRow: { flexDirection: "row", gap: 20, paddingHorizontal: 20, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  logSection: { paddingHorizontal: 16, marginTop: 24, gap: 10 },
  logTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  logRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  logDateBox: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logDay: { fontSize: 18, fontFamily: "Inter_700Bold" },
  logMonth: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase" },
  logInfo: { flex: 1, gap: 5 },
  logOutfitName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  logColors: { flexDirection: "row", gap: 4 },
  logColorDot: { width: 12, height: 12, borderRadius: 6 },
  logSource: { flexDirection: "row", alignItems: "center", gap: 4 },
  logSourceText: { fontSize: 10, fontFamily: "Inter_400Regular" },

  emptyLog: { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 40, paddingHorizontal: 32 },
  emptyLogText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: "85%" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 12 },
  modalSubtitle: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.4 },

  currentEntryCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14, gap: 8 },
  currentEntryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  currentEntryLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  currentEntryName: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },

  confirmRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  confirmText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  confirmBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  confirmBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  wornItemsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  wornItemChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, maxWidth: 120 },

  outfitList: { maxHeight: 340 },
  outfitRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  outfitColorDots: { flexDirection: "row", gap: 3 },
  outfitColorDot: { width: 14, height: 14, borderRadius: 7 },
  outfitInfo: { flex: 1, gap: 2 },
  outfitName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  outfitMeta: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize" },

  emptyPicker: { alignItems: "center", gap: 10, paddingVertical: 30 },
  emptyPickerText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});
