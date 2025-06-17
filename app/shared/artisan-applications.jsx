import { StyleSheet, View } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import GoBackButton from "../../components/GoBackButton";

export default function ArtisanApplications() {
  return (
    <ThemedView>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
        <GoBackButton />
        <StyledHeading text="Applications" style={{ marginTop: 5 }} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({});
