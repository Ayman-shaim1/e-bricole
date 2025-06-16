import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from "react-native";
import React, { useEffect, useRef } from "react";
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

  // Animation setup
  const animation = useRef(
    new Animated.Value(activeTab === text1 ? 0 : 1)
  ).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: activeTab === text1 ? 0 : 1,
      duration: 250,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [activeTab, text1]);

  // Interpolate the animated value to move the indicator
  const indicatorTranslate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 125], // 250/2 = 125 (half the width)
  });

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
        {/* Animated indicator */}
        <Animated.View
          style={[
            styles.animatedIndicator,
            {
              backgroundColor: theme.switchUiactiveTabColor,
              transform: [{ translateX: indicatorTranslate }],
            },
          ]}
        />
        {[text1, text2].map((text, idx) => {
          const isActive = activeTab === text;
          return (
            <Pressable
              key={text}
              style={styles.tab}
              onPress={() => handlePress(text)}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && {
                    color: theme.switchUiactiveTextColor || "#000",
                    fontWeight: "700",
                  },
                  !isActive && {
                    color: theme.switchUiinactiveTextColor || "#888",
                  },
                ]}
              >
                {text}
              </Text>
            </Pressable>
          );
        })}
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
    backgroundColor: "#eee",
    position: "relative",
    overflow: "hidden",
  },
  animatedIndicator: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 119, // 250/2 - 6 (padding)
    height: 38, // matches tab height
    borderRadius: mystyles.borderRadius,
    zIndex: 0,
    fontFamily: "Poppins-Regular",
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: mystyles.borderRadius,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    height: 38,
  },
  tabText: {
    fontWeight: "500",
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
});
