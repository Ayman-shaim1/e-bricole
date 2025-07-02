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
import StarRating from "./StarRating";
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

        {/* Client Review if exists and job is completed */}
        {job.clientReview && job.serviceRequest.status === "completed" && (
          <>
            <View style={styles.reviewSection}>
              <View style={styles.reviewHeader}>
                <MaterialCommunityIcons
                  name="star"
                  size={16}
                  color={colors.warning}
                />
                <StyledText
                  text="Client Review"
                  style={[styles.reviewTitle, { color: theme.textColor }]}
                />
              </View>
              <View style={styles.reviewContent}>
                <StarRating
                  rating={job.clientReview.rating}
                  readonly={true}
                  size={18}
                  label=""
                />
                <StyledText
                  text={job.clientReview.comment}
                  style={[styles.reviewComment, { color: theme.textColor }]}
                  numberOfLines={2}
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.divider} />

        {/* Footer with key details */}
        <View style={styles.footer}>
          <View style={styles.detailContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.primary}
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
              color={colors.primary}
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
              color={colors.primary}
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
  reviewSection: {
    marginVertical: 12,
    backgroundColor: colors.warning + "05",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning + "20",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  reviewContent: {
    paddingHorizontal: 4,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    fontStyle: "italic",
    opacity: 0.8,
  },
}); 