import { StyleSheet, View, Text } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";

export default function JobsScreen() {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textColor }]}>Jobs</Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
  },
});
