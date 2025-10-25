/**
 * 체크박스 컴포넌트
 */
import { Pressable, View } from "react-native";

import useStyles from "./style";
import useColorScheme from "@/hooks/useColorScheme";
import CheckboxIcon from "@/assets/icons/CheckboxIcon";

import type { ICheckBoxProps } from "./type";

export default function CheckBox({
  checked,
  onPress,
  ...props
}: ICheckBoxProps) {
  const styles = useStyles();
  const colorScheme = useColorScheme();

  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" {...props}>
      <View style={styles.wrap}>
        <CheckboxIcon size={20} checked={checked} colorScheme={colorScheme} />
      </View>
    </Pressable>
  );
}
