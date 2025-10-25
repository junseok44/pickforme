import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function useStyle() {
  const insets = useSafeAreaInsets();

  return StyleSheet.create({
    FooterContainer: {
      height: 72 + insets.bottom,
      paddingHorizontal: 20,
      paddingVertical: 8,
      paddingBottom: insets.bottom,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}
