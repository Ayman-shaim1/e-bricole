import { StyleSheet, View } from "react-native";
import StyledHeading from "../../components/StyledHeading";
import GoBackButton from "../../components/GoBackButton";
import { styles as mystyles } from "../../constants/styles";
import ThemedView from "../../components/ThemedView";

export default function ApplicationDetailsScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <GoBackButton />
        <StyledHeading text="Application Details" />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
});
