import React from "react";
import { StyleSheet, View, Animated } from "react-native";
import { useRouter } from "expo-router";
import StyledCard from "./StyledCard";
import StyledText from "./StyledText";
import { colors } from "../constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import StyledHeading from "./StyledHeading";
import StyledLabel from "./StyledLabel";

import Avatar from "./Avatar";
import { useTheme } from "../context/ThemeContext";
import { styles as mystyles } from "../constants/styles";

export default function JobRequest({
  request,
  distance,
  alreadyApplied,
  onPress,
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  // const router = useRouter();

  // Get user name from request data
  const getUserName = () => {
    // Check if user is a string (ID) or an object
    if (typeof request.user === "string") {
      return "Anonymous";
    }

    // If user is an object, try to get the name
    if (request.user && typeof request.user === "object") {
      // Try different possible name properties
      const name =
        request.user.name || request.user.fullName || request.user.username;
      if (name) return name;
    }

    return "Anonymous";
  };

  // const handlePress = () => {
  //   router.push({
  //     pathname: "/shared/request-details",
  //     params: { id: request.$id },
  //   });
  // };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const userName = getUserName();

  return (
    <StyledCard
      style={styles.requestCard}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Already Applied Badge */}
      {alreadyApplied && (
        <View
          style={[
            styles.appliedBadge,
            { backgroundColor: theme === colors.dark ? "#1a4731" : "#e6f9ec" },
          ]}
        >
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color={theme === colors.dark ? "#48bb78" : "#4CAF50"}
          />
          <StyledLabel
            text="Applied"
            style={[
              styles.appliedBadgeText,
              { color: theme === colors.dark ? "#48bb78" : "#388e3c" },
            ]}
          />
        </View>
      )}
      <View style={styles.header}>
        <View style={styles.clientInfo}>
          <Avatar
            size="md"
            source={request.user?.profileImage}
            text={userName}
            style={styles.clientImage}
          />
          <StyledHeading text={userName} style={styles.clientName} />
        </View>
        <View style={styles.titleContainer}>
          <StyledHeading text={request.title} style={styles.title} />
        </View>
      </View>

      <StyledText
        text={request.description}
        style={styles.description}
        numberOfLines={2}
      />

      {request.address && (
        <View style={styles.locationContainer}>
          <View style={styles.locationIconContainer}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={18}
              color={colors.primary}
            />
          </View>
          <StyledLabel
            text={`${distance.toFixed(1)} km - ${request.address.textAddress}`}
            style={styles.location}
          />
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.budgetContainer}>
          <MaterialCommunityIcons
            name="currency-eur"
            size={20}
            color={colors.primary}
            style={styles.budgetIcon}
          />
          <StyledText text={`${request.totalPrice} €`} style={styles.budget} />
        </View>

        <View style={styles.dateContainer}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color={colors.textSecondary}
            style={styles.dateIcon}
          />
          <StyledText
            text={`${request.duration} day${request.duration > 1 ? "s" : ""}`}
            style={styles.date}
          />
        </View>

        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.gray}
          />
        </View>
      </View>

      {request.urgency && (
        <View
          style={[
            styles.urgencyBadge,
            { backgroundColor: colors.danger + "15" },
          ]}
        >
          <MaterialCommunityIcons
            name="alert"
            size={12}
            color={colors.danger}
            style={styles.urgencyIcon}
          />
          <StyledText text="Urgent" style={styles.urgencyText} />
        </View>
      )}
    </StyledCard>
  );
}

const styles = StyleSheet.create({
  requestCard: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  clientImage: {
    marginRight: 8,
  },
  clientName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray + "10",
    borderRadius: 12,
    paddingVertical: 4,
  },
  locationIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray + "20",
    marginVertical: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetIcon: {
    marginLeft: 5,
  },
  budget: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateIcon: {
    marginRight: 4,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  arrowContainer: {
    marginLeft: 12,
  },
  urgencyBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyIcon: {
    marginRight: 4,
  },
  urgencyText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "500",
  },
  appliedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: mystyles.borderRadius,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    zIndex: 10,
  },
  appliedBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 2,
  },
});
