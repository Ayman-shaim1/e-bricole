import { StyleSheet, View, SafeAreaView, Platform, StatusBar as RNStatusBar } from "react-native";
import React from "react";
import { colors } from "../constants/colors";
import { StatusBar } from "expo-status-bar";

export default function ThemedView({ style, children, ...props }) {
  // Use a try-catch to handle cases where ThemeProvider might not be available yet
  let theme = colors.light; // Default fallback theme
  
  try {
    // Dynamically import to avoid the error during initial load
    const { useTheme } = require("../context/ThemeContext");
    const themeContext = useTheme();
    if (themeContext && themeContext.getCurrentTheme) {
      theme = themeContext.getCurrentTheme();
    }
  } catch (error) {
    // Silently fallback to default theme
    console.log("Theme not available yet, using fallback");
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.backgroundColor,
        },
        style,
      ]}
      {...props}
    >
      <StatusBar style={theme === colors.dark ? 'light' : 'dark'} />
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
    paddingTop: Platform.OS === 'android' ? 40 : 5,
    paddingHorizontal: 12,
  },
});
