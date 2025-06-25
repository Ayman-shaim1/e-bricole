import React, { useRef } from "react";
import { StyleSheet, View, Animated } from "react-native";
import { useRouter } from "expo-router";
import StyledCard from "./StyledCard";
import StyledButton from "./StyledButton";
import StyledHeading from "./StyledHeading";
import StyledText from "./StyledText";
import StyledLabel from "./StyledLabel";
import StatusBadge from "./StatusBadge";
import Avatar from "./Avatar";
import ArtisanDisplayedJobAddress from "./ArtisanDisplayedJobAddress";
import { colors } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";
import { formatDate } from "../utils/dateUtils";
import { displayedSplitText } from "../utils/displayedSplitText";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function CurrentJob({ job }) {
  const router = useRouter();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleJobPress = () => {
    router.push({
      pathname: "/shared/current-job-details",
      params: { id: job.serviceRequest.$id },
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

  // Get client name from request data
  const getClientName = () => {
    if (typeof job.serviceRequest.user === "string") {
      return "Anonymous";
    }
    if (job.serviceRequest.user && typeof job.serviceRequest.user === "object") {
      const name =
        job.serviceRequest.user.name || 
        job.serviceRequest.user.fullName || 
        job.serviceRequest.user.username;
      if (name) return name;
    }
    return "Anonymous";
  };

  const clientName = getClientName();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <StyledCard
        style={styles.jobCard}
        onPress={handleJobPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Header with client info and status */}
        <View style={styles.header}>
          <View style={styles.clientInfo}>
            <Avatar
              size="md"
              source={job.serviceRequest.user?.profileImage}
              text={clientName}
              style={styles.clientImage}
            />
            <View style={styles.clientDetails}>
              <StyledHeading text={clientName} style={styles.clientName} />
              <StyledText
                text={`Selected on ${formatDate(job.$updatedAt)}`}
                style={[styles.selectionDate, { color: theme.textColor }]}
              />
            </View>
          </View>
          <StatusBadge status={job.serviceRequest.status} size="small" />
        </View>

        {/* Job title */}
        <View style={styles.titleContainer}>
          <StyledHeading
            text={displayedSplitText(job.serviceRequest.title, 50)}
            style={styles.jobTitle}
          />
        </View>

        {/* Job description */}
        {job.serviceRequest.description && (
          <StyledText
            text={job.serviceRequest.description}
            style={[styles.description, { color: theme.textColor }]}
            numberOfLines={2}
          />
        )}

        {/* Location with Map */}
        {job.serviceRequest.latitude && job.serviceRequest.longitude && (
          <ArtisanDisplayedJobAddress
            latitude={job.serviceRequest.latitude}
            longitude={job.serviceRequest.longitude}
            textAddress={job.serviceRequest.textAddress}
          />
        )}

        <View style={styles.divider} />

        {/* Footer with key details */}
        <View style={styles.footer}>
          <View style={styles.detailContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.textSecondary}
              style={styles.detailIcon}
            />
            <StyledText
              text={`${job.newDuration} day${job.newDuration > 1 ? "s" : ""}`}
              style={[styles.detailText, { color: theme.textColor }]}
            />
          </View>

          <View style={styles.detailContainer}>
            <MaterialCommunityIcons
              name="wrench-outline"
              size={16}
              color={colors.textSecondary}
              style={styles.detailIcon}
            />
            <StyledText
              text={job.serviceRequest.serviceType.title}
              style={[styles.detailText, { color: theme.textColor }]}
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

        {/* Action button */}
        <StyledButton
          text="View Details"
          onPress={handleJobPress}
          color="primary"
          style={styles.viewDetailsButton}
        />
      </StyledCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  jobCard: {
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  clientImage: {
    marginRight: 12,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  selectionDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  titleContainer: {
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.8,
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
    marginBottom: 16,
  },
  detailContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    fontWeight: "500",
  },
  arrowContainer: {
    marginLeft: 8,
  },
  viewDetailsButton: {
    marginTop: 0,
  },
}); 