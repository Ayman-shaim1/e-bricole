import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { styles as mystyles } from "../constants/styles";
import { useTheme } from "../context/ThemeContext";

export default function StyledCard({ children, style, onPress }) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: theme.cardColor,
          borderColor: colors.gray,
        },
        style,
      ]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: mystyles.borderRadius,
    overflow: "hidden",
    paddingVertical: mystyles.paddingVertical,
    paddingHorizontal: 15,
    marginVertical: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
