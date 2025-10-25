import { StyleSheet } from "react-native";

export default function useStyle() {
  return StyleSheet.create({
    ButtonContainer: {
      width: "100%",
      height: 56,
      paddingHorizontal: 20,
      backgroundColor: "#111E4F",
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
    },
    ButtonText: {
      fontWeight: "600",
      fontSize: 18,
      lineHeight: 22,
      color: "#fff",
    },
  });
}
