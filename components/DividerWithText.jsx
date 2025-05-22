import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import StyledLabel from "./StyledLabel";

export default function DividerWithText({ text = "OR" }) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <StyledLabel style={styles.text} text={text}/>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray,
  },
  text: {
    marginHorizontal: 8,
    fontWeight: "500",
  },
});
