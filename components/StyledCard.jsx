import React, { useState } from "react";
import { Pressable, StyleSheet, useColorScheme } from "react-native";
import { styles as mystyles } from "../constants/styles";
import { colors } from "../constants/colors";

export default function StyledCard({ onPress, style, children }) {
  return (
    <Pressable style={[styles.card, style]} onPress={onPress}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: mystyles.borderRadius,
    overflow: "hidden",
    paddingVertical: mystyles.paddingVertical,
    paddingHorizontal: 15,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: colors.gray,
  },
});
