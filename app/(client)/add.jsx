import { StyleSheet, View, Text } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import { useAuth } from "../../context/AuthContext";

export default function AddScreen() {
  const { user } = useAuth();
  
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <StyledHeading text="Add New" />
        <Text style={styles.placeholder}>Add new content screen</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});