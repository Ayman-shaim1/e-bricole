import { StyleSheet, Text } from "react-native";
import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function StyledText({ text, style }) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  return (
    <Text style={[styles.text, { ...style }, { color: theme.textColor }]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 17,
    fontFamily: "Poppins-Regular",
  },
});
