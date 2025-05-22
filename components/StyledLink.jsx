import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Link } from "expo-router";
import { styles as mystyles } from "../constants/styles";
import { colors } from "../constants/colors";
export default function StyledLink({ to, children, color = "primary" }) {
  return (
    <Link href={to} style={[styles.link, { color: colors[color] }]}>
      {children}
    </Link>
  );
}

const styles = StyleSheet.create({
  link: {
    fontFamily: "Poppins-Regular",
    fontSize: mystyles.fontSize,
    marginVertical: 4,
  },
});
