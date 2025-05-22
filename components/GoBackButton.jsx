import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import StyledLabel from "./StyledLabel";

const ARROW_LEFT = require("../assets/icons/arrow-left.png");

export default function GoBackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.bouton} onPress={() => router.back()}>
      <Image source={ARROW_LEFT} style={styles.icon} />
      <StyledLabel text={"go back"} color={"primary"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bouton: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 5,
    marginTop: Platform.OS === "ios" ? 2 : 0,
  },
});
