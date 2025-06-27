import {
  StyleSheet,
  View,
  SafeAreaView,
  Platform,
} from "react-native";
import React from "react";
import { colors } from "../constants/colors";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../context/ThemeContext";

export default function ThemedView({ style, children, ...props }) {
  // Use the theme context with fallback
  const themeContext = useTheme();
  const currentTheme = themeContext && themeContext.getCurrentTheme 
    ? themeContext.getCurrentTheme() 
    : colors.light;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: currentTheme.backgroundColor,
        },
        style,
      ]}
      {...props}
    >
      <StatusBar style={currentTheme === colors.dark ? "light" : "dark"} />
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 40 : 5,
    paddingHorizontal: 12,
  },
});
