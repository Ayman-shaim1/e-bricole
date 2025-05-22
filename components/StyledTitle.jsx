import { StyleSheet, Text, useColorScheme } from "react-native";
import React from "react";
import { colors } from "../constants/colors";

export default function StyledTitle({ text }) {
  const colorSheme = useColorScheme();
  const theme = colors[colorSheme] ?? colors.light;
  return <Text style={[styles.text, { color: theme.textColor }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    fontFamily: "Poppins-ExtraBold",
  },
});
