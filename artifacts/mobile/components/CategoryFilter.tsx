import React from "react";
import {
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import Colors, { CATEGORIES } from "@/constants/colors";
import * as Haptics from "expo-haptics";

interface Props {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ selected, onSelect }: Props) {
  const C = Colors.light;

  const handleSelect = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    onSelect(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => handleSelect(cat.id)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? C.chipSelected : C.chip,
                borderColor: isSelected ? C.tint : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? "#FFFFFF" : C.textSecondary,
                  fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_500Medium",
                },
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    textTransform: "capitalize",
  },
});
