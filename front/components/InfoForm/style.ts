import { StyleSheet } from "react-native";

export default function useStyle() {
  return StyleSheet.create({
    InfoFormContainer: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
      gap: 20,
      width: "100%",
      height: "100%",
    },
    InfoFormSection: {
      width: "100%",
      flex: 1,
      paddingHorizontal: 20,
      alignItems: "flex-start",
      justifyContent: "flex-start",
    },
    InfoFormSection2: {
      justifyContent: "flex-end",
    },
    InfoFormTitle: {
      fontWeight: "600",
      fontSize: 22,
      lineHeight: 27,
      marginBottom: 41,
    },
    InfoFormInput: {
      width: "100%",
      borderColor: "#9FA7C3",
      borderWidth: 1,
      padding: 5,
      marginBottom: 40,
      color: "#111E4F",
      fontSize: 18,
    },
    InfoFormRadioContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
    },
    InfoFormRadioButtonDivider: {
      flex: 1,
      height: 1,
      backgroundColor: "#9FA7C3",
      marginTop: 15,
    },
    InfoFormRadioButtonContainer: {
      backgroundColor: "transparent",
    },
    InfoFormRadioButtonLabel: {
      textAlign: "center",
      fontWeight: "600",
      fontSize: 14,
      lineHeight: 17,
    },
  });
}
