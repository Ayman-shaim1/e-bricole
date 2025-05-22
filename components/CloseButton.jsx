import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { colors } from "../constants/colors";

export default function CloseButton({
  onPress,
  style,
  color = colors.gray,
  size = 24,
}) {
  return (
    <TouchableOpacity style={style} onPress={onPress}>
      <MaterialCommunityIcons name="close" size={size} color={color} />
    </TouchableOpacity>
  );
}
