import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";
import { LinearGradient } from "expo-linear-gradient";

/**
 * ServiceItem Component
 * A card component for displaying individual service items with vertical layout
 *
 * @param {Object} props
 * @param {Object} props.item - The service item data
 * @param {number} props.index - The index of the service item
 */
const ServiceItem = ({ item, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getColors = (index) => {
    const pastelColors = [
      ["#FFB6C1", "#FF69B4"], // Light Pink to Hot Pink
      ["#ADD8E6", "#87CEEB"], // Light Blue to Sky Blue
      ["#98FB98", "#32CD32"], // Pale Green to Lime Green
      ["#FFFACD", "#FFD700"], // Lemon Chiffon to Gold
      ["#E6E6FA", "#9370DB"], // Lavender to Medium Purple
      ["#FFA07A", "#FA8072"], // Light Salmon to Salmon
    ];
    return pastelColors[index % pastelColors.length];
  };

  return (
    <TouchableOpacity style={styles.serviceItem} activeOpacity={0.8}>
      <View style={styles.iconBackground}>
        <LinearGradient
          colors={getColors(index)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientIcon}
        >
          <Image
            source={{ uri: item.iconUrl }}
            style={styles.serviceIconImage}
          />
        </LinearGradient>
      </View>
      <StyledLabel text={item.title} style={styles.serviceTitle} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  serviceItem: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 80, // Adjusted width for vertical layout
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 28, // Half of width/height for perfect circle
    backgroundColor: colors.lightGray, // Fallback background color
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden", // Clip gradient to the circle
  },
  gradientIcon: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceIconImage: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  serviceTitle: {
    fontSize: 14,
    color: colors.darkGray,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ServiceItem;
