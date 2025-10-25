import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import useStyle from "./style";

export default function Footer({ children }) {
  const style = useStyle();

  return <View style={style.FooterContainer}>{children}</View>;
}
