import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

const WHITE_LOGO = require("../assets/images/white_logo.png");

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image source={WHITE_LOGO} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
