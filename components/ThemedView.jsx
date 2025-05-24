import { StyleSheet, View, SafeAreaView, Platform, StatusBar as RNStatusBar } from "react-native";
import React from "react";
import { colors } from "../constants/colors";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../context/ThemeContext";

export default function ThemedView({ style, children, ...props }) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

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
