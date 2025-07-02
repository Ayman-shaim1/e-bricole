import React from "react";
import { StyleSheet, View, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import StyledCard from "./StyledCard";
import StyledText from "./StyledText";
import { colors } from "../constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import StyledHeading from "./StyledHeading";
import StyledLabel from "./StyledLabel";
import StatusBadge from "./StatusBadge";

export default function ClientRequest({ request }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const handlePress = () => {
    console.log("Request ID:", request.$id);
    router.push({
      pathname: "/shared/request-details",
      params: { id: request.$id },
    });
  };

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

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <StyledCard
        style={styles.requestCard}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <StyledHeading text={request.title} style={styles.title} />
            <StatusBadge status={request.status} size="small" />
          </View>
        </View>

        <StyledText text={request.description} style={styles.description} />

        {request.address && (
          <View style={styles.locationContainer}>
            <View style={styles.locationIconContainer}>
              <MaterialCommunityIcons
                name="map-marker"
                size={18}
                color={colors.primary}
              />
            </View>
            <StyledLabel
              text={`${request.address.textAddress} ${request.address.city}`}
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
            <StyledText
              text={`${request.totalPrice} €`}
              style={styles.budget}
            />
          </View>

          <View style={styles.dateContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.primary}
              style={styles.dateIcon}
            />
            <StyledText
              text={`${request.duration || 0} day${
                (request.duration || 0) > 1 ? "s" : ""
              }`}
              style={styles.date}
            />
          </View>

          <View style={styles.arrowContainer}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.primary}
            />
          </View>
        </View>

        {request.urgency && (
          <View
            style={[
              styles.urgencyBadge,
              { backgroundColor: colors.error + "15" },
            ]}
          >
            <MaterialCommunityIcons
              name="alert"
              size={12}
              color={colors.error}
              style={styles.urgencyIcon}
            />
            <StyledText text="Urgent" style={styles.urgencyText} />
          </View>
        )}
      </StyledCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  requestCard: {
    marginBottom: 16,
    padding: 16,
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
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
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
    top: -6,
    right: 24,
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
    fontSize: 11,
    fontWeight: "600",
    color: colors.error,
  },
});
