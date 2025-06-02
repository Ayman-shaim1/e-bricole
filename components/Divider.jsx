import React from "react";
import { StyleSheet, View } from "react-native";
import StyledText from "./StyledText";
import { colors } from "../constants/colors";

export default function Divider({ text, style }) {
  if (!text) {
    return <View style={[styles.simpleDivider, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.line} />
      <View style={styles.textContainer}>
        <StyledText text={text} style={styles.text} />
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  simpleDivider: {
    height: 1,
    backgroundColor: colors.gray,
    width: "100%",
    marginVertical: 12,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray + "20",
  },
  textContainer: {
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
