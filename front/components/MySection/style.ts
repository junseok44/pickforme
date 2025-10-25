import { StyleSheet } from "react-native";
import useColorScheme from "../../hooks/useColorScheme";
import type { ColorScheme } from "../../hooks/useColorScheme";
import Colors from "../../constants/Colors";

export default function useStyle() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  
  return StyleSheet.create({
    MySectionContainer: {
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: theme.border.third,
      borderRadius: 10,
      paddingHorizontal: 14,
      gap: 14,
      paddingVertical: 15,
      marginBottom: 14,
      backgroundColor: theme.background.secondary
    },
    MySectionMenuContent: {
      gap: 14,
    },
    MySectionTitle: {
      fontWeight: "600",
      fontSize: 18,
      lineHeight: 22,
      marginBottom: 4,
      color: theme.text.primary
    },
    MySectionMenu: {
      fontWeight: "400",
      fontSize: 14,
      lineHeight: 17,
      alignItems: "flex-start",
      color: theme.text.primary
    },
  });
}
