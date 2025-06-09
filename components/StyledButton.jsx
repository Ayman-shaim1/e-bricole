import { Image, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { colors } from "../constants/colors";
import StyledLabel from "./StyledLabel";
import { styles as mystyle } from "../constants/styles";
import FeatherIcon from "react-native-vector-icons/Feather";

export default function StyledButton({
  text,
  color = "primary",
  image,
  icon,
  iconColor,
  onPress,
  iconSize = 20,
  textColor,
  backgroundColor,
  style,
}) {
  const bgColor = backgroundColor ? backgroundColor : colors[color];
  const labelColor = textColor
    ? textColor
    : color === "white" || backgroundColor === colors.successLight
    ? "black"
    : "white";

  const finalIconColor = iconColor
    ? colors[iconColor]
    : color === "white" || backgroundColor === colors.successLight
    ? colors.black
    : colors.white;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: bgColor },
        { ...style },
        color === "white" && { borderWidth: 1, borderColor: colors.gray },
      ]}
    >
      {icon &&
        (typeof icon === "string" ? (
          <FeatherIcon
            name={icon}
            size={iconSize}
            color={finalIconColor}
            style={styles.icon}
          />
        ) : (
          React.cloneElement(icon, {
            style: [styles.icon, icon.props.style],
          })
        ))}
      {image && <Image source={image} style={styles.image} />}
      <StyledLabel text={text} color={labelColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: mystyle.marginVertical,
    borderRadius: mystyle.borderRadius,
    paddingVertical: mystyle.paddingVertical,
    paddingHorizontal: 7,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  image: { width: 20, height: 20, marginRight: 10 },
  icon: {
    marginRight: 10,
    marginBottom: 1,
  },
});
