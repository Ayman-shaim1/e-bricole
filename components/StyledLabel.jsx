import { StyleSheet, Text } from "react-native";
import React from "react";
import { colors } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";

export default function StyledLabel({ text, color, style }) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  return (
    <Text
      style={[
        styles.text,
        style,
        { color: color ? colors[color] : theme.textColor },
      ]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
});
