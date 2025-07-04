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
import BottomModal from "../../components/BottomModal";
import StarRating from "../../components/StarRating";
import { formatDate, formatDateWithTime } from "../../utils/dateUtils";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { styles as mystyles } from "../../constants/styles";
import { getArtisanById } from "../../services/userService";
import {
  getServiceApplicationById,
  chooseArtisan,
} from "../../services/requestService";
import { getArtisanReviews } from "../../services/reviewsService";
import StatusBadge from "../../components/StatusBadge";
import { evaluateApplicationPrices } from "../../services/aiPredictionService";

export default function ApplicationDetailsScreen() {
  const { applicationId } = useLocalSearchParams();
  const router = useRouter();
  const { getCurrentTheme } = useTheme();
  const { user, isClient } = useAuth();
  const theme = getCurrentTheme();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [artisanData, setArtisanData] = useState(null);
  const [artisanReviews, setArtisanReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [error, setError] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const [priceEvaluations, setPriceEvaluations] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

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

  // Évaluer les prix proposés par rapport à l'IA
  const evaluatePrices = async () => {
    if (!application?.serviceRequest || !application?.serviceTaskProposals) return;

    setEvaluationLoading(true);
    try {
      const applicationData = {
        serviceTitle: application.serviceRequest.title,
        serviceDescription: application.serviceRequest.description,
        tasks: application.serviceTaskProposals.map(proposal => ({
          title: proposal.serviceTask.title,
          description: proposal.serviceTask.description,
          proposedPrice: parseFloat(proposal.newPrice),
        })),
      };

      const result = await evaluateApplicationPrices(applicationData);
      if (result.success) {
        setPriceEvaluations(result.data);
      }
    } catch (error) {
      console.error("Error evaluating prices:", error);
    } finally {
      setEvaluationLoading(false);
    }
  };

  // Charger les évaluations quand l'application est chargée
  useEffect(() => {
    if (application) {
      evaluatePrices();
    }
  }, [application]);

  const openProfileModal = async () => {
    setShowProfileModal(true);
    setLoading(true);

    try {
      // Fetch artisan data
      const artisanResult = await getArtisanById(application?.artisan?.$id);
      setArtisanData(artisanResult);

      // Fetch artisan reviews
      const reviewsResult = await getArtisanReviews(application?.artisan?.$id);
      if (reviewsResult.success) {
        setArtisanReviews(reviewsResult.data);
      }
    } catch (error) {
      console.error("Error fetching artisan data:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setArtisanData(null);
    setArtisanReviews([]);
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
      Alert.alert(
        "Error",
        "Only clients can choose artisans for service requests."
      );
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
              const result = await chooseArtisan(
                applicationId,
                application.artisan.$id,
                user.$id
              );

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
                Alert.alert(
                  "Error",
                  result.error || "Failed to choose artisan"
                );
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

      {/* AI Price Analysis Legend */}
      {application?.serviceTaskProposals?.length > 0 && (
        <View style={styles.legendContainer}>
          <StyledText text="AI Price Analysis:" style={styles.legendTitle} />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#1565c0' }]} />
              <StyledText text="Excellent" style={[styles.legendText, { color: theme.textColor }]} />
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#1b5e20' }]} />
              <StyledText text="Good" style={[styles.legendText, { color: theme.textColor }]} />
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#cc5500' }]} />
              <StyledText text="Bad" style={[styles.legendText, { color: theme.textColor }]} />
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8b0000' }]} />
              <StyledText text="Very Bad" style={[styles.legendText, { color: theme.textColor }]} />
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
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
                  text={`Applied ${formatDateWithTime(
                    application?.$createdAt
                  )}`}
                  style={[styles.applicationDate, { color: theme.textColor }]}
                />
              </View>
            </View>
            <StatusBadge
              status={application?.status || "pending"}
              size="small"
              style={styles.statusBadge}
            />
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
                  {/* Badge d'évaluation AI sous les prix */}
                  {priceEvaluations?.evaluations && (
                    (() => {
                      const evaluation = priceEvaluations.evaluations.find(
                        e => e.taskTitle === proposal.serviceTask.title
                      );
                      if (evaluation && evaluation.evaluation.label !== "Unknown") {
                        return (
                          <View style={styles.aiEvaluationContainer}>
                            <Ionicons 
                              name="sparkles" 
                              size={14} 
                              color={evaluation.evaluation.color} 
                            />
                            <StyledText
                              text="AI Price Analysis:"
                              style={styles.aiLabel}
                            />
                                                         <View
                               style={[
                                 styles.tinyEvaluationDot,
                                 { backgroundColor: evaluation.evaluation.color }
                               ]}
                             />
                            {evaluation.predictedPrice && (
                              <StyledText
                                text={`(AI suggests: $${evaluation.predictedPrice.toFixed(2)})`}
                                style={styles.aiPredictionText}
                              />
                            )}
                          </View>
                        );
                      }
                      return null;
                    })()
                  )}
                  {evaluationLoading && (
                    <View style={styles.aiEvaluationContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <StyledText
                        text="AI analyzing price..."
                        style={styles.aiLoadingText}
                      />
                    </View>
                  )}
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
      <BottomModal visible={showProfileModal} onClose={closeProfileModal} height={800}>
        <View style={styles.modalHeader}>
          <StyledHeading text="Artisan Profile" style={styles.modalTitle} />
          <TouchableOpacity
            onPress={closeProfileModal}
            style={styles.closeButton}
          ></TouchableOpacity>
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
            <StyledText
              text={artisanData?.profession || "Professional Artisan"}
              style={styles.profileProfession}
            />
          </View>

          <View style={styles.profileDetailsContainer}>
            {/* Contact Information Card */}
            <StyledCard style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color={colors.primary}
                  />
                  <StyledHeading
                    text="Contact Information"
                    style={styles.cardTitle}
                  />
                </View>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={theme.textColor}
                  />
                  <StyledText
                    text={artisanData?.email}
                    style={[styles.infoText, { color: theme.textColor }]}
                  />
                </View>
              </View>
            </StyledCard>

            {/* Professional Information Card */}
            <StyledCard style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <MaterialCommunityIcons
                    name="briefcase-outline"
                    size={24}
                    color={colors.primary}
                  />
                  <StyledHeading
                    text="Professional Details"
                    style={styles.cardTitle}
                  />
                </View>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons
                    name="account-tie-outline"
                    size={20}
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
                    size={20}
                    color={theme.textColor}
                  />
                  <StyledText
                    text={`${artisanData?.experienceYears || 0} years of experience`}
                    style={[styles.infoText, { color: theme.textColor }]}
                  />
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={20}
                    color={theme.textColor}
                  />
                  <StyledText
                    text={artisanData?.isClient ? "Client Account" : "Professional Artisan"}
                    style={[styles.infoText, { color: theme.textColor }]}
                  />
                </View>
              </View>
            </StyledCard>

            {/* Skills Card */}
            {artisanData?.skills && artisanData.skills.length > 0 && (
              <StyledCard style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <MaterialCommunityIcons
                      name="lightning-bolt-outline"
                      size={24}
                      color={colors.primary}
                    />
                    <StyledHeading
                      text="Skills & Expertise"
                      style={styles.cardTitle}
                    />
                  </View>
                  <View style={styles.skillCount}>
                    <StyledText
                      text={`${artisanData.skills.length} skill${artisanData.skills.length !== 1 ? "s" : ""}`}
                      style={styles.skillCountText}
                    />
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.skillsContainer}>
                    {artisanData.skills.map((skill, index) => (
                      <View
                        key={index}
                        style={styles.skillBadge}
                      >
                        <StyledText
                          text={skill}
                          style={styles.skillText}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              </StyledCard>
            )}

            {/* Reviews Card */}
            {artisanReviews && artisanReviews.length > 0 ? (
              <StyledCard style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <MaterialCommunityIcons
                      name="star-outline"
                      size={24}
                      color={colors.primary}
                    />
                    <StyledHeading
                      text="Reviews"
                      style={styles.cardTitle}
                    />
                  </View>
                  <View style={styles.reviewCount}>
                    <StyledText
                      text={`${artisanReviews.length} review${artisanReviews.length !== 1 ? "s" : ""}`}
                      style={styles.reviewCountText}
                    />
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <StyledText
                    text="Client feedback and ratings:"
                    style={[styles.reviewsDescription, { color: theme.textColor }]}
                  />
                  {artisanReviews.map((review, index) => (
                    <View key={review.$id} style={styles.reviewItem}>
                      <View style={styles.reviewClientRow}>
                        <Avatar
                          source={review.client?.profileImage}
                          text={review.client?.name || "Anonymous"}
                          size="sm"
                        />
                        <StyledLabel
                          text={review.client?.name || "Anonymous"}
                          style={[styles.reviewClientName, { color: theme.textColor }]}
                        />
                      </View>
                      <View style={styles.reviewRatingRow}>
                        <StarRating
                          rating={review.rating}
                          readonly={true}
                          size={16}
                          label=""
                          hideRating={true}
                        />
                      </View>
                      <StyledLabel
                        text={review.comment}
                        style={[styles.reviewComment, { color: theme.textColor }]}
                      />
                      <View style={styles.reviewDivider} />
                      <StyledLabel
                        text={formatDate(review.$createdAt)}
                        style={[styles.reviewDate, { color: theme.textColor }]}
                      />
                    </View>
                  ))}
                </View>
              </StyledCard>
            ) : !loading && (
              <StyledCard style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <MaterialCommunityIcons
                      name="star-outline"
                      size={24}
                      color={colors.primary}
                    />
                    <StyledHeading
                      text="Reviews"
                      style={styles.cardTitle}
                    />
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.noReviewsContainer}>
                    <MaterialCommunityIcons
                      name="star-off-outline"
                      size={48}
                      color={colors.gray}
                    />
                    <StyledText
                      text="No reviews yet"
                      style={[styles.noReviewsText, { color: theme.textColor }]}
                    />
                    <StyledText
                      text="This artisan hasn't received any reviews yet."
                      style={[styles.noReviewsDescription, { color: theme.textColor }]}
                    />
                  </View>
                </View>
              </StyledCard>
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
          </View>
        </View>
      </BottomModal>
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
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalContent: {
    paddingBottom: 20,
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileDetailsContainer: {
    marginTop: 20,
  },
  infoCard: {
    marginBottom: 20,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    gap: 12,
    marginTop: 10,
  },
  skillBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primary + "15",
    borderWidth: 1,
    borderColor: colors.primary + "25",
  },
  skillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  skillCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary + "15",
  },
  skillCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  reviewItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  reviewClientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewClientName: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  reviewRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
    opacity: 0.8,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    marginVertical: 12,
  },
  reviewDate: {
    fontSize: 10,
    opacity: 0.6,
    fontWeight: "500",
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
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  profileProfession: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
    marginTop: 5,
    textAlign: "center",
  },
  noReviewsContainer: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 12,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    textAlign: "center",
  },
  noReviewsDescription: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 20,
  },
  reviewCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary + "15",
  },
  reviewCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  reviewsDescription: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
    opacity: 0.8,
  },
  aiEvaluationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 8,
    gap: 6,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  tinyEvaluationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  aiPredictionText: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#888",
    flex: 1,
  },
  aiLoadingText: {
    fontSize: 12,
    fontStyle: "italic",
    color: colors.primary,
    marginLeft: 4,
  },
  legendContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.primary,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
