import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import StyledButton from "../../components/StyledButton";
import StyledCard from "../../components/StyledCard";
import GoBackButton from "../../components/GoBackButton";
import StatusBadge from "../../components/StatusBadge";
import Avatar from "../../components/Avatar";
import ArtisanDisplayedJobAddress from "../../components/ArtisanDisplayedJobAddress";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/dateUtils";
import { displayedSplitText } from "../../utils/displayedSplitText";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getCurrentJobDetails, startJob, completeTask } from "../../services/requestService";
import { hasClientReviewedArtisan } from "../../services/reviewsService";
import StarRating from "../../components/StarRating";
import Divider from "../../components/Divider";

export default function CurrentJobDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobStarted, setJobStarted] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [currentStatus, setCurrentStatus] = useState(null);
  const [clientReview, setClientReview] = useState(null);
  const [hasClientReview, setHasClientReview] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchClientReview = async (serviceRequestId, clientId) => {
    if (!serviceRequestId || !clientId || !user?.$id) return;
    
    try {
      const result = await hasClientReviewedArtisan(
        clientId,
        user.$id,
        serviceRequestId
      );
      
      if (result.hasReviewed && result.review) {
        setClientReview(result.review);
        setHasClientReview(true);
      } else {
        setClientReview(null);
        setHasClientReview(false);
      }
    } catch (error) {
      console.error("Error fetching client review:", error);
      setClientReview(null);
      setHasClientReview(false);
    }
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const result = await getCurrentJobDetails(user.$id, id);

      if (result.success && result.data) {
        console.log("Job data received:", result.data);
        console.log("Service Request:", result.data.serviceRequest);
        console.log("Service Type:", result.data.serviceRequest?.serviceType);
        
        // Debug address data
        console.log("Address data debug:");
        console.log("- latitude:", result.data.serviceRequest?.latitude);
        console.log("- longitude:", result.data.serviceRequest?.longitude);
        console.log("- textAddress:", result.data.serviceRequest?.textAddress);
        console.log("- address:", result.data.serviceRequest?.address);
        console.log("- location:", result.data.serviceRequest?.location);
        
        setJob(result.data);
        setCurrentStatus(result.data.serviceRequest?.status);
        
        // Check which tasks are already completed and update local state
        if (result.data.serviceRequest?.serviceTasks) {
          const completedTaskIds = new Set();
          result.data.serviceRequest.serviceTasks.forEach(task => {
            if (task.status === "completed") {
              completedTaskIds.add(task.$id);
            }
          });
          setCompletedTasks(completedTaskIds);
        }
        
        // Set jobStarted based on status
        if (result.data.serviceRequest?.status === "active" || result.data.serviceRequest?.status === "completed") {
          setJobStarted(true);
        }

        // Fetch client review if job is completed
        if (result.data.serviceRequest?.status === "completed" && result.data.serviceRequest?.user) {
          const clientId = typeof result.data.serviceRequest.user === 'string' 
            ? result.data.serviceRequest.user 
            : result.data.serviceRequest.user.$id;
          
          await fetchClientReview(result.data.serviceRequest.$id, clientId);
        }
      } else {
        Alert.alert("Error", result.error || "Job not found");
        router.back();
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      Alert.alert("Error", "Failed to load job details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBeginJob = () => {
    Alert.alert("Begin Job", "Are you sure you want to start this job?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Begin", 
        onPress: async () => {
          try {
            // Start the job using the service
            const result = await startJob(user.$id, id, job.startDate);
            
            if (result.success) {
              // Update local state to reflect the changes
              setJobStarted(true);
              setCurrentStatus("active");
              Alert.alert("Success", "Job started successfully!");
            } else {
              // Show error message if job cannot be started
              Alert.alert("Error", result.error);
            }
          } catch (error) {
            Alert.alert("Error", "Failed to start the job. Please try again.");
          }
        }
      },
    ]);
  };

  const handleEndTask = (taskId) => {
    Alert.alert(
      "End Task",
      "Are you sure you want to mark this task as completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              // Complete the task using the service
              const result = await completeTask(user.$id, id, taskId);
              
              if (result.success) {
                // Update local state to reflect the task completion
                setCompletedTasks((prev) => new Set([...prev, taskId]));
                
                // If all tasks are completed, update the job status
                if (result.allTasksCompleted) {
                  setCurrentStatus("completed");
                  Alert.alert("Success", "All tasks completed! The job is now finished.");
                } else {
                  Alert.alert("Success", "Task completed successfully!");
                }
              } else {
                // Show error message if task cannot be completed
                Alert.alert("Error", result.error);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to complete the task. Please try again.");
            }
          },
        },
      ]
    );
  };

  const getClientName = () => {
    if (!job?.serviceRequest?.user) return "Anonymous";
    if (typeof job.serviceRequest.user === "string") return "Anonymous";

    const name =
      job.serviceRequest.user.name ||
      job.serviceRequest.user.fullName ||
      job.serviceRequest.user.username;
    return name || "Anonymous";
  };

  const getTasks = () => {
    // Use the actual service tasks from serviceRequest if they exist
    if (
      job?.serviceRequest?.serviceTasks &&
      Array.isArray(job.serviceRequest.serviceTasks)
    ) {
      return job.serviceRequest.serviceTasks.map((task, index) => {
        // Find corresponding proposal for this task with more robust matching
        const proposal = job?.serviceTaskProposals?.find((p) => {
          const proposalTaskId = typeof p.serviceTask === 'string' 
            ? p.serviceTask 
            : p.serviceTask?.$id;
          
          return proposalTaskId === task.$id;
        });

        return {
          id: task.$id,
          title: task.title || `Task ${index + 1}`,
          description: task.description || "No description available",
          originalPrice: task.price || 0,
          proposedPrice: proposal?.newPrice || task.price || 0,
        };
      });
    }

    // Fallback: check if there are serviceTaskProposals that can be converted to tasks
    if (job?.serviceTaskProposals && Array.isArray(job.serviceTaskProposals)) {
      return job.serviceTaskProposals.map((proposal, index) => ({
        id: proposal.serviceTask || proposal.id || `proposal-${index}`,
        title: proposal.title || `Task ${index + 1}`,
        description: proposal.description || "No description available",
        originalPrice: proposal.originalPrice || 0,
        proposedPrice: proposal.newPrice || 0,
      }));
    }

    // If no tasks found, return empty array
    return [];
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!job) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <GoBackButton />
          <StyledText
            text="Job not found"
            style={[styles.error, { color: theme.textColor }]}
          />
        </ScrollView>
      </ThemedView>
    );
  }

  const tasks = getTasks();
  const clientName = getClientName();

  // Safety check to ensure job exists
  if (!job || !job.serviceRequest) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <GoBackButton />
          <StyledText
            text="Job data is incomplete"
            style={[styles.error, { color: theme.textColor }]}
          />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <GoBackButton />
          <StyledHeading
            text={displayedSplitText(job.serviceRequest.title, 32)}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Begin Job Button */}
        {!jobStarted && currentStatus === "pre-begin" && (
          <View style={styles.buttonContainer}>
            <StyledButton
              text="Begin Job"
              onPress={handleBeginJob}
              color="primary"
              style={styles.beginJobButton}
            />
          </View>
        )}
        <StyledCard>
          <View style={styles.clientInfo}>
            <Avatar
              size="md"
              source={job.serviceRequest.user?.profileImage}
              text={clientName}
              style={styles.clientAvatar}
            />
            <View style={styles.clientDetails}>
              <StyledHeading text={clientName} style={styles.clientName} />
              <StyledText
                text={`Selected on ${formatDate(job.$updatedAt)}`}
                style={[styles.selectionDate, { color: theme.textColor }]}
              />
            </View>
            <StatusBadge status={currentStatus} size="medium" />
          </View>
          
          {/* Client Review Section */}
          {hasClientReview && clientReview && (
            <>
              <Divider />
              <View style={styles.reviewSection}>
                <View style={styles.reviewHeader}>
                  <MaterialCommunityIcons
                    name="star"
                    size={20}
                    color={colors.warning}
                  />
                  <StyledText
                    text="Client Review"
                    style={[styles.reviewTitle, { color: theme.textColor }]}
                  />
                </View>
                <View style={styles.reviewContent}>
                  <StarRating
                    rating={clientReview.rating}
                    readonly={true}
                    size={24}
                    label=""
                    hideRating={true}
                  />
                  <StyledText
                    text={clientReview.comment}
                    style={[styles.reviewComment, { color: theme.textColor }]}
                  />
                </View>
              </View>
            </>
          )}
          
          <Divider />
          <StyledText text={job.serviceRequest.description} />

          {/* Location */}
          {(() => {
            // Use the same structure as in JobRequest component
            const latitude = job.serviceRequest.latitude || job.serviceRequest.address?.latitude;
            const longitude = job.serviceRequest.longitude || job.serviceRequest.address?.longitude;
            const textAddress = job.serviceRequest.address?.textAddress || job.serviceRequest.textAddress;
            
            console.log("Location data in current-job-details:");
            console.log("- job.serviceRequest.address:", job.serviceRequest.address);
            console.log("- textAddress found:", textAddress);
            console.log("- latitude:", latitude);
            console.log("- longitude:", longitude);
            
            // Show address if we have coordinates
            if (latitude && longitude) {
              return (
                <ArtisanDisplayedJobAddress
                  latitude={parseFloat(latitude)}
                  longitude={parseFloat(longitude)}
                  textAddress={textAddress}
                />
              );
            }
            
            // Show text address only if we have it but no coordinates
            if (textAddress) {
              return (
                <View style={styles.addressOnlyContainer}>
                  <View style={styles.addressRow}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={20}
                      color={colors.primary}
                    />
                    <StyledText
                      text={textAddress}
                      style={[styles.addressText, { color: theme.textColor }]}
                    />
                  </View>
                </View>
              );
            }
            
            return null;
          })()}

          {/* Job Info */}
          <View style={styles.datesContainer}>
            <View style={styles.dateItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={colors.primary}
              />
              <StyledText
                text={`${job.newDuration} day${job.newDuration > 1 ? "s" : ""}`}
                style={styles.dateText}
              />
            </View>
            {job.startDate && (
              <View style={styles.dateItem}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={20}
                  color={colors.primary}
                />
                <StyledText
                  text={`Starts ${formatDate(job.startDate)}`}
                  style={styles.dateText}
                />
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="wrench-outline"
              size={20}
              color={colors.primary}
            />
            <StyledHeading
              text={
                job.serviceRequest.serviceType?.title ||
                job.serviceRequest.serviceType?.name ||
                (typeof job.serviceRequest.serviceType === "string"
                  ? job.serviceRequest.serviceType
                  : "Unknown Service Type")
              }
              style={styles.infoText}
            />
          </View>
        </StyledCard>

        {/* Tasks Section */}
        <StyledCard style={styles.tasksCard}>
          <View style={styles.taskHeader}>
            <View style={styles.taskHeaderLeft}>
              <MaterialCommunityIcons
                name="clipboard-list-outline"
                size={28}
                color={colors.primary}
              />
              <StyledHeading
                text="Tasks"
                style={[styles.taskHeading, { color: theme.textColor }]}
              />
            </View>
            <View style={styles.taskCount}>
              <StyledText
                text={`${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
                style={styles.taskCountText}
              />
            </View>
          </View>

          {tasks.length > 0 ? (
            <>
              <StyledText
                text={
                  currentStatus === "active"
                    ? "Complete each task as you finish it:"
                    : "Tasks will be available once the job is active."
                }
                style={[styles.tasksDescription, { color: theme.textColor }]}
              />

              {tasks.map((task, index) => (
                <View
                  key={task.id}
                  style={[
                    styles.taskItem,
                    index === 0 && styles.firstTaskItem,
                    { backgroundColor: theme.cardColor },
                  ]}
                >
                  <View style={styles.taskContent}>
                    <View style={styles.taskMain}>
                      <View style={styles.taskNumberContainer}>
                        <StyledText
                          text={`${index + 1}`}
                          style={[
                            styles.taskNumberText,
                            { color: theme.textColor },
                          ]}
                        />
                      </View>
                      <View style={styles.taskInfo}>
                        <StyledText
                          text={task.title}
                          style={[styles.taskTitle, { color: theme.textColor }]}
                        />
                      </View>
                      <View style={styles.taskPricing}>
                        <View style={styles.priceContainer}>
                          <View style={styles.originalPrice}>
                            <StyledText
                              text="Original"
                              style={[
                                styles.priceLabel,
                                { color: theme.textColor },
                              ]}
                            />
                            <View style={styles.strikethroughContainer}>
                              <StyledText
                                text={`${task.originalPrice} €`}
                                style={[
                                  styles.originalPriceText,
                                  { color: theme.textColor },
                                ]}
                              />
                              <View style={styles.strikethroughLine} />
                            </View>
                          </View>
                          <View style={styles.proposedPrice}>
                            <StyledText
                              text="Your price"
                              style={[
                                styles.priceLabel,
                                { color: theme.textColor },
                              ]}
                            />
                            <StyledText
                              text={`${task.proposedPrice} €`}
                              style={[
                                styles.proposedPriceText,
                                { color: theme.textColor },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.taskDescriptionContainer}>
                    <StyledText
                      text={task.description}
                      style={[
                        styles.taskDescriptionText,
                        { color: theme.textColor },
                      ]}
                      numberOfLines={2}
                    />
                  </View>

                  <View style={styles.taskAction}>
                    {completedTasks.has(task.id) ? (
                      <View style={styles.completedBadge}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={18}
                          color={colors.success}
                        />
                        <StyledText
                          text="Completed"
                          style={[
                            styles.completedText,
                            { color: theme.textColor },
                          ]}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleEndTask(task.id)}
                        disabled={currentStatus !== "active"}
                        style={[
                          styles.endTaskButton,
                          currentStatus !== "active" && styles.disabledEndTaskButton,
                        ]}
                      >
                        <StyledText
                          text="End Task"
                          style={[
                            styles.endTaskText,
                            { color: theme.textColor },
                            currentStatus !== "active" && styles.disabledEndTaskText,
                          ]}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.noTasksContainer}>
              <MaterialCommunityIcons
                name="clipboard-list-outline"
                size={48}
                color={colors.gray}
              />
              <StyledText
                text="No tasks defined for this job"
                style={[styles.noTasksText, { color: theme.textColor }]}
              />
              <StyledText
                text="Tasks will appear here if they are defined in the service request."
                style={[styles.noTasksDescription, { color: theme.textColor }]}
              />
            </View>
          )}

          {/* Total Section */}
          {tasks.length > 0 && (
            <>
              <Divider />
              <StyledCard style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <View style={styles.totalTitleRow}>
                    <MaterialCommunityIcons
                      name="wallet-outline"
                      size={24}
                      color={colors.primary}
                    />
                    <StyledText
                      text="Total proposed price"
                      style={[styles.totalLabel, { color: theme.textColor }]}
                    />
                  </View>
                  <StyledHeading
                    text={`${tasks.reduce(
                      (total, task) => total + task.proposedPrice,
                      0
                    )} €`}
                    style={[styles.totalPrice, { color: theme.textColor }]}
                  />
                </View>
              </StyledCard>
            </>
          )}
        </StyledCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  clientStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  clientAvatar: {
    marginRight: 12,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectionDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  buttonContainer: {},
  beginJobButton: {
    width: "100%",
  },
  datesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  tasksCard: {
    marginTop: 20,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
  },
  taskHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  taskHeading: {
    fontSize: 22,
    fontWeight: "700",
  },
  taskCount: {
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  taskCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  tasksDescription: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
    opacity: 0.8,
  },
  taskItem: {
    borderRadius: 16,
    marginBottom: 16,
  },
  taskContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  taskMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  taskNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  taskNumberText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  taskDescriptionContainer: {
    marginTop: 12,
  },
  taskDescriptionText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  taskPricing: {
    alignItems: "flex-end",
    gap: 8,
    flexShrink: 0,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  originalPrice: {
    alignItems: "center",
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  originalPriceText: {
    fontSize: 16,
    fontWeight: "600",
  },
  strikethroughContainer: {
    position: "relative",
    alignItems: "center",
  },
  strikethroughLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.gray,
    zIndex: 1,
  },
  proposedPrice: {
    alignItems: "center",
    gap: 4,
  },
  proposedPriceText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  taskAction: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
  },
  endTaskButton: {
    minWidth: 140,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary + "20",
    backgroundColor: colors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledEndTaskButton: {
    backgroundColor: colors.gray + "20",
    borderColor: colors.gray + "30",
  },
  endTaskText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  disabledEndTaskText: {
    color: colors.gray,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.success + "15",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.success + "30",
  },
  completedText: {
    color: colors.success,
    fontWeight: "600",
    fontSize: 14,
  },
  noTasksContainer: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 12,
  },
  noTasksText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  noTasksDescription: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 20,
  },
  error: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  totalCard: {
    marginTop: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  firstTaskItem: {
    marginTop: 20,
  },
  addressOnlyContainer: {
    marginVertical: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary + "10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + "20",
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  reviewSection: {
    marginVertical: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  reviewContent: {
    paddingHorizontal: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontStyle: "italic",
    opacity: 0.8,
  },
});
