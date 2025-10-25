import { forwardRef } from "react";
import { View as RNView } from "react-native";

import { useThemeColor } from "../../hooks/useThemeColor";

import type { TViewProps } from "./type";

export default forwardRef<RNView, TViewProps>((props, ref) => {
  const { style, lightColor, darkColor, color, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background",
    color
  );

  return (
    <RNView style={[{ backgroundColor }, style]} {...otherProps} ref={ref} />
  );
});
