import { StyleSheet, View } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";

export default function MessagesScreen() {
  return (
    <ThemedView style={styles.container}>
      <StyledHeading text="Messages" />
      <View style={styles.content}>{/* Content will be added later */}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
  },
});
