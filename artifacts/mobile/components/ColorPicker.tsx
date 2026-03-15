import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors, { COLOR_PALETTE } from "@/constants/colors";

interface Props {
  selectedColor: string;
  selectedHex: string;
  onSelect: (name: string, hex: string) => void;
}

export function ColorPicker({ selectedColor, selectedHex, onSelect }: Props) {
  const C = Colors.light;

  return (
    <View>
      <Text style={[styles.label, { color: C.textSecondary }]}>Color</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {COLOR_PALETTE.map((color) => {
          const isSelected = selectedColor === color.name;
          return (
            <Pressable
              key={color.name}
              onPress={() => onSelect(color.name, color.hex)}
              style={styles.colorItem}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: color.hex },
                  color.name === "White" || color.name === "Cream" ? styles.dotBorder : undefined,
                  isSelected ? styles.dotSelected : undefined,
                ]}
              >
                {isSelected && (
                  <Feather
                    name="check"
                    size={14}
                    color={color.name === "White" || color.name === "Cream" || color.name === "Yellow" ? "#1A1A1A" : "#FFFFFF"}
                  />
                )}
              </View>
              <Text style={[styles.colorName, { color: isSelected ? C.tint : C.textTertiary }]}>
                {color.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 4,
  },
  colorItem: {
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dotBorder: {
    borderWidth: 1.5,
    borderColor: "#E0DAD2",
  },
  dotSelected: {
    borderWidth: 2.5,
    borderColor: "#C9A96E",
  },
  colorName: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
