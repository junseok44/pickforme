import { StyleSheet } from "react-native";
import useColorScheme from "../../hooks/useColorScheme";
import type { ColorScheme } from "../../hooks/useColorScheme";
import Colors from "../../constants/Colors";

export default function useStyle() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  return StyleSheet.create({
    SelectButtonContainer: {
      flexDirection: "row",
      gap: 20,
      flex: 1,
      justifyContent: "flex-start",
    },
    SelectButton: {
      width: 70,
      height: 52,
      paddingVertical: 0,
      borderWidth: 1,
      borderColor: theme.border.third,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 6,
      backgroundColor: theme.background.secondary,
    },
    SelectButtonActive: {
      backgroundColor: theme.button.primary.background,
    },
    SelectButtonText: {
      fontSize: 14,
      lineHeight: 16, // ASIS 14
      textAlign: "center",
      fontWeight: "600",
      color: theme.text.primary,
    },
    SelectButtonTextActive: {
      color: theme.text.secondary,
    },
  });
}
