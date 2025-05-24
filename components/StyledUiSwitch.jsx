import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import StyledLabel from "./StyledLabel";
import { styles as mystyles } from "../constants/styles";
import { colors } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";

export default function StyledUiSwitch({
  text1 = "1",
  text2 = "2",
  onChange,
  activeTab,
  setActiveTab,
}) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  const handlePress = (text) => {
    setActiveTab(text);
    onChange?.(text); // call parent if provided
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.toggleContainer,
          { backgroundColor: theme.switchUiBackGroundColor },
        ]}
      >
        {[text1, text2].map((text) => (
          <Pressable
            key={text}
            style={[styles.tab, {backgroundColor:activeTab === text && theme.switchUiactiveTabColor} ]}
            onPress={() => handlePress(text)}
          >
            <StyledLabel
              style={[styles.tabText,{backgroundColor:activeTab === text && theme.switchUiactiveTabColor} ]}
              text={text}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 5,
    alignItems: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: mystyles.borderRadius,
    padding: 3,
    width: 250,
    justifyContent: "space-between",
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: mystyles.borderRadius,
    alignItems: "center",
  },
  activeTab: {
    // backgroundColor: "#ffffff",
  },
  tabText: {
    color: "#888",
    fontWeight: "500",
  },
  activeText: {
    color: "#000",
    fontWeight: "700",
  },
});
