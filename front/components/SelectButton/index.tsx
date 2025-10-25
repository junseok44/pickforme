import { View, Text, TouchableOpacity } from "react-native";

import useStyle from "./style";

import type { ISelectButtonProps } from "./type";

export default function SelectButton({
  value,
  items,
  onChange,
}: ISelectButtonProps) {
  const style = useStyle();

  return (
    <View style={style.SelectButtonContainer}>
      {items?.map(function ({ name, value: itemValue }) {
        return (
          <TouchableOpacity
            onPress={function () {
              onChange?.(itemValue);
            }}
            key={`select-button-${name}`}
            style={[
              style.SelectButton,
              value === itemValue && style.SelectButtonActive,
            ]}
          >
            <Text
              style={[
                style.SelectButtonText,
                value === itemValue && style.SelectButtonTextActive,
              ]}
            >
              {name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
