import { StyleSheet, View } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <Header />
      <View style={styles.content}>
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
  },
});
