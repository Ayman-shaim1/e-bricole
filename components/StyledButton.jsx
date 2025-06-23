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
  disabled = false,
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

  // Apply disabled styling
  const disabledBgColor = disabled ? colors.gray : bgColor;
  const disabledLabelColor = disabled ? colors.white : labelColor;
  const disabledIconColor = disabled ? colors.white : finalIconColor;

  return (
    <TouchableOpacity
      onPress={disabled ? null : onPress}
      style={[
        styles.button,
        { backgroundColor: disabledBgColor },
        { ...style },
        color === "white" && { borderWidth: 1, borderColor: colors.gray },
        disabled && styles.disabledButton,
      ]}
    >
      {icon &&
        (typeof icon === "string" ? (
          <FeatherIcon
            name={icon}
            size={iconSize}
            color={disabledIconColor}
            style={styles.icon}
          />
        ) : (
          React.cloneElement(icon, {
            style: [styles.icon, icon.props.style],
          })
        ))}
      {image && <Image source={image} style={styles.image} />}
      <StyledLabel text={text} color={disabledLabelColor} />
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
  disabledButton: {
    backgroundColor: colors.gray,
  },
});
