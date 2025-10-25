import { StyleSheet } from "react-native";

export default function useStyle() {
  return StyleSheet.create({
    PushFormContainer: {},
    PushFormTitle: {
      fontWeight: "600",
      fontSize: 20,
      lineHeight: 24,
      marginBottom: 30,
    },
    PushFormContent: {
      gap: 10,
    },
    PushFormRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    PushFormSeperator: {
      height: 1,
      backgroundColor: "#DFE4F5",
    },
    PushFormLabel: {
      flex: 1,
      width: 50,
      fontWeight: "400",
      fontSize: 14,
      lineHeight: 17,
    },
  });
}
