import { PressableProps } from "react-native";

export interface ICheckBoxProps extends PressableProps {
  checked: boolean;
  onPress: () => void;
}
