import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import StyledCard from "../../components/StyledCard";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import StyledLabel from "../../components/StyledLabel";
import Avatar from "../../components/Avatar";
import GoBackButton from "../../components/GoBackButton";
import ThemedView from "../../components/ThemedView";
import StyledButton from "../../components/StyledButton";
import { formatDate, formatDateWithTime } from "../../utils/dateUtils";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { styles as mystyles } from "../../constants/styles";
import { getArtisanById } from "../../services/userService";
import { getServiceApplicationById, chooseArtisan } from "../../services/requestService";

export default function ApplicationDetailsScreen() {
  const { applicationId } = useLocalSearchParams();
  const router = useRouter();
  const { getCurrentTheme } = useTheme();
  const { user, isClient } = useAuth();
  const theme = getCurrentTheme();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [artisanData, setArtisanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [error, setError] = useState(null);
  const [choosing, setChoosing] = useState(false);

  // Fetch application data
  const fetchApplication = async () => {
    if (!applicationId) {
      setError("Application ID is missing");
      setApplicationLoading(false);
      return;
    }

    try {
      setApplicationLoading(true);
      const result = await getServiceApplicationById(applicationId);
      
      if (result.success && result.data) {
        setApplication(result.data);
      } else {
        setError(result.error || "Failed to fetch application details");
      }
    } catch (err) {
      setError("Failed to fetch application details. Please try again later.");
    } finally {
      setApplicationLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const openProfileModal = async () => {
    setShowProfileModal(true);
    setLoading(true);

    const data = await getArtisanById(application?.artisan?.$id);
    setArtisanData(data);
    setLoading(false);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setArtisanData(null);
  };

  const navigateToApplications = () => {
    if (application?.serviceRequest?.$id) {
      router.push({
        pathname: "/shared/artisan-applications",
        params: { requestId: application.serviceRequest.$id },
      });
    } else {
      router.back();
    }
  };

  const handleChooseArtisan = async () => {
    // Check if the current user is a client
    if (!isClient()) {
      Alert.alert("Error", "Only clients can choose artisans for service requests.");
      return;
    }

    // Check if the application has already been processed
    if (application.status !== "pending") {
      Alert.alert("Error", "This application has already been processed.");
      return;
    }

    Alert.alert(
      "Choose Artisan",
      `Are you sure you want to choose ${application?.artisan?.name} for this project?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Choose",
          style: "default",
          onPress: async () => {
            try {
              setChoosing(true);
              const result = await chooseArtisan(applicationId, application.artisan.$id, user.$id);
              
              if (result.success) {
                Alert.alert(
                  "Success",
                  `${application?.artisan?.name} has been selected for this project!`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        router.back();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert("Error", result.error || "Failed to choose artisan");
              }
            } catch (error) {
              console.error("Error choosing artisan:", error);
              Alert.alert("Error", "An unexpected error occurred");
            } finally {
              setChoosing(false);
            }
          },
        },
      ]
    );
  };

  if (applicationLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <GoBackButton />
          <StyledHeading text="Application Details" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <StyledText
            text="Loading application details..."
            style={[styles.loadingText, { color: theme.textColor }]}
          />
        </View>
      </ThemedView>
    );
  }

  if (error || !application) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <GoBackButton />
          <StyledHeading text="Application Details" />
        </View>
        <View style={styles.errorContainer}>
          <StyledText
            text={error || "Application not found"}
            style={[styles.errorText, { color: theme.textColor }]}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <GoBackButton />
        <StyledHeading text="Application Details" />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <StyledCard style={styles.applicationCard}>
          {/* Header with artisan info */}
          <View style={styles.headerSection}>
            <View style={styles.artisanInfo}>
              <Avatar
                source={application?.artisan?.profileImage}
                text={application?.artisan?.name}
              />
              <View style={styles.artisanDetails}>
                <StyledHeading
                  text={application?.artisan?.name || "Unknown Artisan"}
                  style={styles.artisanName}
                />
                <StyledText
                  text={`Applied ${formatDateWithTime(application?.$createdAt)}`}
                  style={[styles.applicationDate, { color: theme.textColor }]}
                />
              </View>
            </View>
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: application.status === "accepted" 
                  ? colors.success + "20" 
                  : application.status === "refused" 
                  ? colors.error + "20" 
                  : colors.primary + "20" 
              }
            ]}>
              <StyledText
                text={application.status?.toUpperCase() || "PENDING"}
                style={[
                  styles.statusText,
                  { 
                    color: application.status === "accepted" 
                      ? colors.success 
                      : application.status === "refused" 
                      ? colors.error 
                      : colors.primary 
                  }
                ]}
              />
            </View>
          </View>

          {/* Duration section */}
          <View style={styles.section}>
            <StyledLabel
              text="Project Duration"
              style={styles.sectionTitle}
              color="primary"
            />
            <View
              style={[
                styles.durationRow,
                { backgroundColor: theme.backgroundColor },
              ]}
            >
              <View style={styles.durationItem}>
                <StyledText
                  text="Original"
                  style={[styles.durationLabel, { color: theme.textColor }]}
                />
                <StyledText
                  text={`${application?.serviceRequest?.duration} days`}
                  style={[styles.durationValue, { color: theme.textColor }]}
                />
              </View>
              <View style={styles.durationArrow}>
                <StyledText text="→" style={styles.arrowText} color="primary" />
              </View>
              <View style={styles.durationItem}>
                <StyledText
                  text="Proposed"
                  style={[styles.durationLabel, { color: theme.textColor }]}
                />
                <StyledText
                  text={`${application?.newDuration} days`}
                  style={[
                    styles.durationValue,
                    { color: colors.primary, fontWeight: "bold" },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Service tasks */}
          {application?.serviceTaskProposals?.length > 0 && (
            <View style={styles.section}>
              <StyledLabel
                text="Service Details"
                style={styles.sectionTitle}
                color="primary"
              />
              {application.serviceTaskProposals.map((proposal, index) => (
                <View
                  key={proposal.$id}
                  style={[
                    styles.taskItem,
                    { backgroundColor: theme.backgroundColor },
                  ]}
                >
                  <StyledText
                    text={proposal.serviceTask.title}
                    style={styles.taskTitle}
                    color="primary"
                  />
                  <View style={styles.priceRow}>
                    <View style={styles.priceItem}>
                      <StyledText
                        text="Original"
                        style={[styles.priceLabel, { color: theme.textColor }]}
                      />
                      <StyledText
                        text={`$${proposal.serviceTask.price}`}
                        style={[styles.priceValue, { color: theme.textColor }]}
                      />
                    </View>
                    {Number(proposal.serviceTask.price) !==
                      Number(proposal.newPrice) && (
                      <>
                        <View style={styles.priceArrow}>
                          <StyledText
                            text="→"
                            style={styles.arrowText}
                            color="primary"
                          />
                        </View>
                        <View style={styles.priceItem}>
                          <StyledText
                            text="Proposed"
                            style={[
                              styles.priceLabel,
                              { color: theme.textColor },
                            ]}
                          />
                          <StyledText
                            text={`$${proposal.newPrice}`}
                            style={[
                              styles.priceValue,
                              { color: colors.primary, fontWeight: "bold" },
                            ]}
                          />
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Message section */}
          <View style={styles.section}>
            <StyledLabel
              text="Message from Artisan"
              style={styles.sectionTitle}
              color="primary"
            />
            <View
              style={[
                styles.messageContainer,
                { backgroundColor: theme.backgroundColor },
              ]}
            >
              <StyledText
                text={application?.message}
                style={[styles.messageText, { color: theme.textColor }]}
              />
            </View>
          </View>

          {/* Start date */}
          <View style={styles.section}>
            <View
              style={[
                styles.startDateRow,
                { backgroundColor: theme.backgroundColor },
              ]}
            >
              <StyledLabel
                text="Planned Start Date"
                style={[styles.startDateLabel, { color: theme.textColor }]}
              />
              <StyledText
                text={formatDate(application?.startDate)}
                style={styles.startDateValue}
                color="primary"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <StyledButton
              text="Show Profile"
              onPress={openProfileModal}
              color="primary"
              style={styles.showProfileButton}
            />
            {isClient() && application.status === "pending" && (
              <StyledButton
                text={choosing ? "Choosing..." : "Choose"}
                onPress={handleChooseArtisan}
                color="success"
                style={styles.chooseButton}
                disabled={choosing}
              />
            )}
          </View>
        </StyledCard>
      </ScrollView>

      {/* Artisan Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeProfileModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.cardColor }]}
          >
            <View style={styles.modalHeader}>
              <StyledHeading text="Artisan Profile" style={styles.modalTitle} />
              <TouchableOpacity
                onPress={closeProfileModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileHeaderSection}>
              <View style={styles.profileHeaderBackground} />
              <View style={styles.profileAvatarContainer}>
                <Avatar
                  source={artisanData?.profileImage}
                  text={artisanData?.name}
                  size={"xl"}
                />
              </View>
            </View>

            <View style={styles.profileInfoContainer}>
              <View style={styles.profileNameContainer}>
                <StyledHeading
                  text={artisanData?.name}
                  style={styles.profileName}
                />
              </View>

              <ScrollView
                style={styles.profileDetailsScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.profileDetailsContent}
              >
                {/* Contact Information */}
                <View style={styles.infoSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <StyledLabel
                      text="Contact Information"
                      style={styles.sectionTitle}
                      color="primary"
                    />
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="mail-outline"
                      size={16}
                      color={theme.textColor}
                    />
                    <StyledText
                      text={artisanData?.email}
                      style={[styles.infoText, { color: theme.textColor }]}
                    />
                  </View>
                </View>

                {/* Professional Information */}
                <View style={styles.infoSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="briefcase-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <StyledLabel
                      text="Professional Details"
                      style={styles.sectionTitle}
                      color="primary"
                    />
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="account-tie-outline"
                      size={16}
                      color={theme.textColor}
                    />
                    <StyledText
                      text={artisanData?.serviceType?.title || "Service Type"}
                      style={[styles.infoText, { color: theme.textColor }]}
                    />
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={16}
                      color={theme.textColor}
                    />
                    <StyledText
                      text={`${
                        artisanData?.experienceYears || 0
                      } years of experience`}
                      style={[styles.infoText, { color: theme.textColor }]}
                    />
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={16}
                      color={theme.textColor}
                    />
                    <StyledText
                      text={
                        artisanData?.isClient
                          ? "Client Account"
                          : "Professional Artisan"
                      }
                      style={[styles.infoText, { color: theme.textColor }]}
                    />
                  </View>
                </View>

                {/* Education & Certifications */}
                <View style={styles.infoSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="school-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <StyledLabel
                      text="Education & Certifications"
                      style={styles.sectionTitle}
                      color="primary"
                    />
                  </View>
                  <View style={styles.educationItem}>
                    <View style={styles.educationHeader}>
                      <StyledText
                        text={artisanData?.profession || "Not specified"}
                        style={[
                          styles.educationTitle,
                          { color: theme.textColor },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* Skills */}
                {artisanData?.skills && artisanData.skills.length > 0 && (
                  <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons
                        name="lightning-bolt-outline"
                        size={20}
                        color={colors.primary}
                      />
                      <StyledLabel
                        text="Skills & Expertise"
                        style={styles.sectionTitle}
                        color="primary"
                      />
                    </View>
                    <View style={styles.skillsContainer}>
                      {artisanData.skills.map((skill, index) => (
                        <View
                          key={index}
                          style={[
                            styles.skillBadge,
                            { backgroundColor: colors.primary + "10" },
                          ]}
                        >
                          <StyledText
                            text={skill}
                            style={[
                              styles.skillText,
                              { color: colors.primary },
                            ]}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Loading state */}
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <StyledText
                      text="Loading profile..."
                      style={[styles.loadingText, { color: theme.textColor }]}
                    />
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  scrollView: {
    flex: 1,
  },
  applicationCard: {
    marginTop: 0,
    padding: 20,
    marginBottom: 20,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  artisanInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    width: "100%",
  },
  artisanDetails: {
    marginLeft: 15,
    flex: 1,
  },
  artisanName: {
    fontSize: 18,
    marginBottom: 5,
  },
  applicationDate: {
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 10,
  },
  durationItem: {
    alignItems: "center",
    flex: 1,
  },
  durationLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  durationArrow: {
    paddingHorizontal: 10,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  taskItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceItem: {
    alignItems: "center",
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  priceArrow: {
    paddingHorizontal: 10,
  },
  messageContainer: {
    padding: 15,
    borderRadius: 10,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  startDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
  },
  startDateLabel: {
    fontSize: 14,
  },
  startDateValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSection: {
    gap: 12,
  },
  showProfileButton: {
    marginBottom: 0,
  },
  chooseButton: {
    marginBottom: 0,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "95%",
    height: "80%",
    borderRadius: mystyles.borderRadius,
    overflow: "hidden",
    paddingHorizontal: mystyles.paddingHorizontal,
    paddingVertical: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  profileHeaderSection: {
    position: "relative",
    marginBottom: 20,
  },
  profileHeaderBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  profileAvatarContainer: {
    alignItems: "center",
    paddingTop: 20,
  },
  profileNameContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  profileName: {
    fontSize: 24,
    marginBottom: 8,
  },
  profileInfoContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileDetailsScroll: {
    flex: 1,
    marginTop: 20,
  },
  profileDetailsContent: {
    paddingBottom: 30,
  },
  infoSection: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
    paddingLeft: 4,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  skillBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  skillText: {
    fontSize: 13,
    fontWeight: "500",
  },
  educationItem: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  educationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  backToApplicationsButton: {
    marginLeft: 10,
  },
  statusBadge: {
    padding: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
