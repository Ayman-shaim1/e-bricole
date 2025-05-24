import { StyleSheet, Text } from "react-native";
import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function StyledHeading({ text }) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  return <Text style={[styles.text, { color: theme.textColor }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
  },
});
