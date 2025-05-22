import { StyleSheet, Text, useColorScheme } from "react-native";
import React from "react";
import { colors } from "../constants/colors";

export default function StyledText({ text }) {
  const colorSheme = useColorScheme();
  const theme = colors[colorSheme] ?? colors.light;
  return <Text style={[styles.text, { color: theme.textColor }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 17,
    fontFamily:'Poppins-Regular'
  },
});
