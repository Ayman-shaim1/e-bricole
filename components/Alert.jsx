import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StyledHeading from "./StyledHeading";
import { colors } from "../constants/colors";

const STATUS_STYLES = {
  success: {
    backgroundColor: colors.successLight,
    darkBackgroundColor: "#1a4731",
    icon: "checkmark-circle-outline",
    iconColor: colors.success,
    darkIconColor: "#48bb78",
  },
  danger: {
    backgroundColor: "#fed7d7",
    darkBackgroundColor: "#742a2a",
    icon: "close-circle-outline",
    iconColor: colors.danger,
    darkIconColor: "#f56565",
  },
  warning: {
    backgroundColor: "#fefcbf",
    darkBackgroundColor: "#744210",
    icon: "warning-outline",
    iconColor: colors.warning,
    darkIconColor: "#ecc94b",
  },
  info: {
    backgroundColor: colors.accentLight3,
    darkBackgroundColor: "#2c5282",
    icon: "information-circle-outline",
    iconColor: colors.primary,
    darkIconColor: "#4299e1",
  },
};

export default function Alert({
  status = "info",
  title,
  description,
  onClose,
  style,
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.info;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? statusStyle.darkBackgroundColor
            : statusStyle.backgroundColor,
        },
        style,
      ]}
    >
      <Ionicons
        name={statusStyle.icon}
        size={24}
        color={isDark ? statusStyle.darkIconColor : statusStyle.iconColor}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        {title ? (
          <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
            {title}
          </Text>
        ) : null}
        {description ? (
          <Text
            style={[styles.description, { color: isDark ? "#fff" : "#000" }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    minHeight: 56,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: "Poppins-Bold",
    fontSize: 20,
    marginBottom: 2,
  },
  description: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  closeButton: {
    marginLeft: 10,
    padding: 4,
  },
});
