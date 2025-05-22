import { StyleSheet, Text, useColorScheme } from "react-native";
import React from "react";
import { colors } from "../constants/colors";

export default function StyledLabel({ text, color, style }) {
  const colorSheme = useColorScheme();
  const theme = colors[colorSheme] ?? colors.light;
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
