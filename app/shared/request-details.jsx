import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import StyledCard from "../../components/StyledCard";
import GoBackButton from "../../components/GoBackButton";
import StyledButton from "../../components/StyledButton";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { getRequestById, getServiceApplications } from "../../services/requestService";
import StatusBadge from "../../components/StatusBadge";
import Divider from "../../components/Divider";
import { displayedSplitText } from "../../utils/displayedSplitText";
import { styles as mystyles } from "../../constants/styles";
import ImageSkeleton from "../../components/ImageSkeleton";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ArtisanDisplayedJobAddress from "../../components/ArtisanDisplayedJobAddress";
import BottomModal from "../../components/BottomModal";
import AlertComponent from "../../components/Alert";
import FormikForm from "../../components/FormikForm";
import FormInput from "../../components/FormInput";
import FormRichTextBox from "../../components/FormRichTextBox";
import {
  serviceApplicationSchema,
  serviceApplicationStep1Schema,
} from "../../utils/validators";
import {
  submitServiceApplicationWithProposals,
  hasUserAppliedToRequest,
} from "../../services/requestService";
import FormStyledDatePicker from "../../components/FormStyledDatePicker";
import FormStarRating from "../../components/FormStarRating";
import { reviewSchema } from "../../utils/validators";
import { createReview, hasClientReviewedArtisan } from "../../services/reviewsService";
import { useRouter } from "expo-router";

export default function RequestDetailsScreen() {
  const { id, onJobApplied } = useLocalSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const router = useRouter();
  const [visibleNegoModal, setVisibleNegoModal] = useState(false);
  const [visibleReviewModal, setVisibleReviewModal] = useState(false);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [formStep, setFormStep] = useState(1);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(true);
  const [applicationCount, setApplicationCount] = useState(0);
  const [acceptedApplication, setAcceptedApplication] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(true);
  const [existingReview, setExistingReview] = useState(null);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const result = await getRequestById(id);
      if (result.success && result.data) {
        setRequest(result.data);
      } else {
        setError(result.error || "Failed to fetch request details");
      }
    } catch (err) {
      setError("Failed to fetch request details. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchApplicationCount = async () => {
    if (!id || !user?.isClient || authLoading) return;
    
    try {
      const applications = await getServiceApplications(id);
      setApplicationCount(applications?.length || 0);
      
      // Find accepted application if status allows showing proposals
      if (request && ["pre-begin", "active", "completed"].includes(request.status)) {
        const accepted = applications?.find(app => app.status === "accepted");
        
        if (accepted) {
          console.log("Accepted application found:", {
            applicationId: accepted.$id,
            artisan: accepted.artisan,
            artisanType: typeof accepted.artisan,
            artisanId: typeof accepted.artisan === 'object' ? accepted.artisan?.$id : accepted.artisan
          });
        }
        
        setAcceptedApplication(accepted || null);
      }
    } catch (error) {
      console.error("Error fetching application count:", error);
      setApplicationCount(0);
      setAcceptedApplication(null);
    }
  };

  const checkIfClientHasReviewed = async () => {
    if (!id || !user?.isClient || authLoading || !acceptedApplication) {
      setCheckingReview(false);
      return;
    }
    
    try {
      setCheckingReview(true);
      
      // Extract artisan ID properly - handle both object and string cases
      const artisanId = typeof acceptedApplication.artisan === 'string' 
        ? acceptedApplication.artisan 
        : acceptedApplication.artisan?.$id;
      
      if (!artisanId || typeof artisanId !== 'string') {
        console.warn("No valid artisan ID found in accepted application:", {
          artisan: acceptedApplication.artisan,
          artisanId,
          type: typeof artisanId
        });
        setHasReviewed(false);
        setExistingReview(null);
        return;
      }
      
      // Validate ID format
      if (artisanId.length > 36) {
        console.warn("Artisan ID too long:", artisanId);
        setHasReviewed(false);
        setExistingReview(null);
        return;
      }
      
      console.log("Checking review for:", {
        clientId: user.$id,
        artisanId: artisanId,
        serviceRequestId: id
      });
      
      const result = await hasClientReviewedArtisan(
        user.$id,
        artisanId,
        id
      );
      
      if (result.hasReviewed) {
        setHasReviewed(true);
        setExistingReview(result.review);
      } else {
        setHasReviewed(false);
        setExistingReview(null);
      }
    } catch (error) {
      console.error("Error checking if client has reviewed:", error);
      setHasReviewed(false);
      setExistingReview(null);
    } finally {
      setCheckingReview(false);
    }
  };

  const onRefresh = useCallback(() => {
    if (authLoading) return;
    setRefreshing(true);
    fetchRequestDetails();
    if (user?.isClient) {
      fetchApplicationCount();
    }
  }, [user?.isClient, authLoading]);

  const handleImageLoad = (imageIndex) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageIndex]: true,
    }));
  };

  const openImage = (image) => {
    setSelectedImage(image);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const closeImage = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedImage(null);
    });
  };

  const handleNegotiation = () => {
    setVisibleNegoModal(true);
  };

  const handleAddReview = () => {
    setVisibleReviewModal(true);
  };

  const handleReviewSubmit = async (values, { resetForm }) => {
    setReviewLoading(true);
    setReviewError(null);
    
    try {
      if (!acceptedApplication) {
        throw new Error("No accepted application found");
      }

      // Extract artisan ID properly - handle both object and string cases
      const artisanId = typeof acceptedApplication.artisan === 'string' 
        ? acceptedApplication.artisan 
        : acceptedApplication.artisan?.$id;
      
      if (!artisanId || typeof artisanId !== 'string') {
        throw new Error("No valid artisan ID found");
      }
      
      // Validate ID format
      if (artisanId.length > 36) {
        throw new Error("Invalid artisan ID format");
      }

      const reviewData = {
        clientId: user.$id,
        artisanId: artisanId,
        serviceRequestId: request.$id,
        rating: values.rating,
        comment: values.comment,
        serviceRequestTitle: request.title,
      };
      
      const result = await createReview(reviewData);
      
      if (result.success) {
        setReviewSuccess(true);
        setHasReviewed(true); // Hide the review button
        
        Alert.alert(
          "Review Submitted",
          "Thank you for your review! It has been submitted successfully.",
          [
            {
              text: "OK",
              onPress: () => {
                setVisibleReviewModal(false);
                resetForm();
                setReviewSuccess(false);
                setReviewError(null);
              }
            }
          ]
        );
      } else {
        throw new Error(result.error || "Failed to submit review");
      }
      
    } catch (error) {
      setReviewError(error.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  // Préparation des valeurs initiales pour Formik
  const initialFormValues = request
    ? {
        newDuration: request.duration || 1,
        tasks: request.serviceTasks.map((task) => ({
          taskId: task.$id,
          newPrice: task.price,
        })),
        startDate: "",
        message: "",
      }
    : {
        newDuration: 1,
        tasks: [],
        startDate: "",
        message: "",
      };

  // Nouvelle fonction de soumission
  // Helper function to get proposed price for a task
  const getProposedPriceForTask = (taskId) => {
    if (!acceptedApplication?.serviceTaskProposals) return null;
    
    const proposal = acceptedApplication.serviceTaskProposals.find(
      p => {
        const proposalTaskId = typeof p.serviceTask === 'string' 
          ? p.serviceTask 
          : p.serviceTask?.$id;
        return proposalTaskId === taskId;
      }
    );
    
    return proposal?.newPrice || null;
  };

  // Helper function to check if we should show proposed prices
  const shouldShowProposedPrices = () => {
    return user?.isClient && 
           request && 
           ["pre-begin", "active", "completed"].includes(request.status) &&
           acceptedApplication;
  };

  // Helper function to check if we should show task status
  const shouldShowTaskStatus = () => {
    return user?.isClient && 
           request && 
           ["pre-begin", "active", "completed"].includes(request.status);
  };

  const handleApplicationSubmit = async (values, { resetForm }) => {
    setFormLoading(true);
    setFormError(null);
    try {
      // Format the date properly
      const formattedDate =
        values.startDate instanceof Date
          ? values.startDate.toISOString()
          : new Date(values.startDate).toISOString();

      const res = await submitServiceApplicationWithProposals({
        newDuration: values.newDuration,
        startDate: formattedDate,
        message: values.message,
        serviceRequestId: request.$id,
        artisanId: user.$id,
        clientId: request.user,
        tasks: values.tasks,
      });
      if (res.success) {
        Alert.alert(
          "Application Sent",
          "Your application has been sent to the client. You will be notified if the client responds.",
          [{ text: "OK" }]
        );
        setTimeout(() => {
          setFormSuccess(true);
          setVisibleNegoModal(false);
          resetForm();
          setAlreadyApplied(true);
          if (onJobApplied) onJobApplied(request.$id);
        }, 300);
      } else {
        setFormError(res.error || "Erreur lors de la soumission");
      }
    } catch (e) {
      setFormError(e.message || "Erreur inattendue");
    } finally {
      setFormLoading(false);
      setFormStep(1);
    }
  };

  useEffect(() => {
    if (!id) {
      setError("Request ID is missing");
      setLoading(false);
      return;
    }
    fetchRequestDetails();
  }, [id]);

  useEffect(() => {
    if (!id || !user || authLoading) return;
    setCheckingApplied(true);
    hasUserAppliedToRequest(id, user.$id)
      .then(setAlreadyApplied)
      .finally(() => setCheckingApplied(false));
  }, [id, user, authLoading]);

  useEffect(() => {
    if (user?.isClient && id && !authLoading && request) {
      fetchApplicationCount();
    }
  }, [user?.isClient, id, authLoading, request]);

  useEffect(() => {
    if (user?.isClient && acceptedApplication && request && request.status === "completed") {
      checkIfClientHasReviewed();
    } else {
      setCheckingReview(false);
    }
  }, [user?.isClient, acceptedApplication, request?.status]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (id && !authLoading) {
        fetchRequestDetails();
        if (user?.isClient) {
          fetchApplicationCount();
        }
      }
    }, [id, user?.isClient, authLoading])
  );

  // Wait for auth to complete and user data to be available
  if (loading || authLoading || !user || user.isClient === undefined) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  // Show info message at the top if already applied
  const topInfo =
    !user?.isClient && alreadyApplied ? (
      <AlertComponent
        status="success"
        title="Application Sent"
        description="You have already applied to this job. You will be notified if the client responds."
        style={{ marginBottom: 10 }}
      />
    ) : null;

  if (error || !request) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.errorContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <GoBackButton />
          <StyledText
            text={error || "Request not found"}
            style={styles.error}
          />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <GoBackButton />
          <StyledHeading
            text={displayedSplitText(request.title, !user?.isClient ? 32 : 18)}
          />
        </View>
        {user?.isClient && (
          <StatusBadge status={request.status} size="medium" />
        )}
      </View>
      
      {/* Loading Review Status */}
      {user?.isClient && 
       request.status === "completed" && 
       checkingReview && 
       acceptedApplication && (
        <View style={styles.buttonContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Add Review Button for completed jobs */}
      {user?.isClient && 
       request.status === "completed" && 
       !checkingReview && 
       !hasReviewed && 
       acceptedApplication && (
        <View style={styles.buttonContainer}>
          <StyledButton
            text="Add Review"
            onPress={handleAddReview}
            color="primary"
            style={styles.addReviewButton}
          />
        </View>
      )}

      {/* Review Already Submitted Message */}
      {user?.isClient && 
       request.status === "completed" && 
       !checkingReview && 
       hasReviewed && 
       existingReview && (
        <View style={styles.buttonContainer}>
          <AlertComponent
            status="success"
            title="Review Submitted"
            description={`You have already reviewed this service with ${existingReview.rating} stars.`}
            style={{ marginBottom: 10 }}
          />
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {topInfo}
        {user?.isClient && request.status === "in progress" && (
          <View style={styles.buttonContainer}>
            <StyledButton
              text="View Applications"
              onPress={() =>
                router.push(
                  `shared/artisan-applications?requestId=${request.$id}`
                )
              }
              color="primary"
              style={styles.viewApplicationsButton}
            />
            <View style={styles.applicationCountCard}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <StyledText
                text={`${applicationCount} application${applicationCount !== 1 ? 's' : ''} received`}
                style={styles.applicationCountText}
                color="primary"
              />
            </View>
          </View>
        )}
        <StyledCard>
          <StyledText text={request.description} />
          <Divider />
          {/* Afficher la carte et l'adresse si l'utilisateur est un artisan */}
          {!user?.isClient && (
            <>
              <ArtisanDisplayedJobAddress
                latitude={request.latitude}
                longitude={request.longitude}
                textAddress={request.textAddress}
              />
              <Divider />
            </>
          )}
          <View style={styles.datesContainer}>
            <View style={styles.dateItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <StyledText
                text={`${request.duration || 0} day${
                  (request.duration || 0) > 1 ? "s" : ""
                }`}
                style={styles.dateText}
              />
            </View>
          </View>
          <Divider />
          <View style={styles.infoRow}>
            <Ionicons name="construct" size={20} color={colors.primary} />
            <StyledHeading
              text={request.serviceType.title}
              style={styles.infoText}
            />
          </View> 
          {user?.isClient && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <StyledText text={request.textAddress} style={styles.infoText} />
            </View>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesContainer}
          >
            {request.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => openImage(image)}
                style={styles.imageWrapper}
              >
                <Image
                  style={[
                    styles.image,
                    !imageLoadingStates[index] && styles.hiddenImage,
                  ]}
                  source={{ uri: image }}
                  resizeMode="cover"
                  onLoad={() => handleImageLoad(index)}
                />
                {!imageLoadingStates[index] && (
                  <View style={styles.imageLoadingContainer}>
                    <ImageSkeleton width={120} height={120} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </StyledCard>
        <Modal
          visible={selectedImage !== null}
          transparent={true}
          onRequestClose={closeImage}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeImage}
          >
            <Animated.View
              style={[
                styles.modalImageContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </Animated.View>
          </TouchableOpacity>
        </Modal>
        {request.serviceTasks &&
          request.serviceTasks.length > 0 &&
          request.serviceTasks.map((task, index) => {
            const proposedPrice = getProposedPriceForTask(task.$id);
            
            return (
              <StyledCard key={task.$id} style={styles.taskCard}>
                {/* Task Header */}
                <View style={styles.taskHeader}>
                  <View style={styles.taskNumberContainer}>
                    <StyledText text={`${index + 1}`} style={[styles.taskNumber, { color: colors.primary }]} />
                  </View>
                  <View style={styles.taskTitleContainer}>
                    <StyledHeading 
                      text={displayedSplitText(task.title, 25)} 
                      style={styles.taskTitle}
                    />
                    {shouldShowTaskStatus() && (
                      <StatusBadge status={task.status} size="small" />
                    )}
                  </View>
                </View>

                {/* Task Description */}
                <StyledText
                  text={task.description}
                  style={styles.taskDescription}
                />
                
                <Divider />

                                {/* Task Pricing */}
                {shouldShowProposedPrices() && proposedPrice !== null ? (
                  <View style={styles.taskPricingContainer}>
                    <View style={[
                      styles.priceComparisonRow, 
                      { 
                        backgroundColor: theme.backgroundColor === "#1A1A1A" ? "#1C2B3D" : colors.accentLight3,
                        borderColor: theme.backgroundColor === "#1A1A1A" ? colors.accentLight1 : colors.accentLight2,
                        borderWidth: 1,
                      }
                    ]}>
                      <View style={styles.originalPriceSection}>
                        <StyledText text="Original" style={styles.priceSectionLabel} />
                        <View style={styles.strikethroughContainer}>
                          <StyledText
                            text={`${task.price} €`}
                            style={styles.originalPriceValue}
                          />
                          <View style={[
                            styles.strikethroughLine,
                            { backgroundColor: theme.backgroundColor === "#1A1A1A" ? colors.accentLight2 : colors.gray }
                          ]} />
                        </View>
                      </View>
                      
                      <View style={styles.arrowContainer}>
                        <Ionicons 
                          name="arrow-forward" 
                          size={16} 
                          color={colors.primary} 
                        />
                      </View>
                      
                      <View style={styles.proposedPriceSection}>
                        <StyledText text="Proposed" style={styles.priceSectionLabel} />
                        <StyledHeading
                          text={`${proposedPrice} €`}
                          style={[styles.proposedPriceValue, { color: colors.primary }]}
                        />
                      </View>
                    </View>
                    
                    {/* Savings indicator */}
                    {proposedPrice < task.price && (
                      <View style={styles.savingsContainer}>
                        <Ionicons 
                          name="trending-down" 
                          size={16} 
                          color={colors.success} 
                        />
                        <StyledText 
                          text={`Save ${task.price - proposedPrice} €`}
                          style={styles.savingsText}
                        />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={[
                    styles.singlePriceContainer, 
                    { 
                      backgroundColor: theme.backgroundColor === "#1A1A1A" ? "#1C2B3D" : colors.accentLight3,
                      borderColor: theme.backgroundColor === "#1A1A1A" ? colors.accentLight1 : colors.accentLight2,
                      borderWidth: 1,
                    }
                  ]}>
                    <Ionicons
                      name="pricetag"
                      size={20}
                      color={colors.primary}
                    />
                    <StyledHeading
                      text={`${task.price} €`}
                      style={[styles.singlePriceText, { color: colors.primary }]}
                    />
                  </View>
                )}
              </StyledCard>
            );
          })}
        {request.serviceTasks && request.serviceTasks.length > 0 && (
          <StyledCard>
            {shouldShowProposedPrices() ? (
              <View style={styles.totalComparisonContainer}>
                <View style={styles.totalRow}>
                  <View style={styles.totalTitleRow}>
                    <Ionicons
                      name="wallet-outline"
                      size={24}
                      color={colors.gray}
                    />
                    <StyledText text="Original total" style={styles.totalLabel} />
                  </View>
                  <View style={styles.strikethroughContainer}>
                    <StyledText
                      text={
                        request.serviceTasks.reduce(
                          (total, task) => total + task.price,
                          0
                        ) + " €"
                      }
                      style={styles.originalTotalText}
                    />
                    <View style={[
                      styles.strikethroughLine,
                      { backgroundColor: theme.backgroundColor === "#1A1A1A" ? colors.accentLight2 : colors.gray }
                    ]} />
                  </View>
                </View>
                <Divider />
                <View style={styles.totalRow}>
                  <View style={styles.totalTitleRow}>
                    <Ionicons
                      name="wallet"
                      size={24}
                      color={colors.primary}
                    />
                    <StyledText text="Proposed total" style={styles.totalLabel} />
                  </View>
                  <StyledHeading
                    text={
                      request.serviceTasks.reduce((total, task) => {
                        const proposedPrice = getProposedPriceForTask(task.$id);
                        return total + (proposedPrice || task.price);
                      }, 0) + " €"
                    }
                    style={[styles.proposedTotalText, { color: colors.primary }]}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.totalRow}>
                <View style={styles.totalTitleRow}>
                  <Ionicons
                    name="wallet-outline"
                    size={24}
                    color={colors.primary}
                  />
                  <StyledText text="Total à payer" style={styles.totalLabel} />
                </View>
                <StyledHeading
                  text={
                    request.serviceTasks.reduce(
                      (total, task) => total + task.price,
                      0
                    ) + " €"
                  }
                  style={styles.totalPrice}
                />
              </View>
            )}
          </StyledCard>
        )}

        {!user?.isClient &&
          !checkingApplied &&
          (alreadyApplied ? (
            <AlertComponent
              status="info"
              title="Already Applied"
              description="You have already applied to this job. Please wait for the client's response."
              style={{ marginBottom: 10 }}
            />
          ) : (
            <>
              <AlertComponent
                status="warning"
                title="How to proceed"
                description={
                  "You can apply for this job by submitting your proposed prices and duration.\n\n- Tap 'Apply' to submit your application with your proposed changes."
                }
                style={{ marginBottom: 10 }}
              />
              <View style={styles.buttonContainer}>
                <StyledButton
                  text="Apply"
                  onPress={handleNegotiation}
                  style={styles.negotiateButton}
                  color="primary"
                />
              </View>

              <BottomModal
                visible={visibleNegoModal}
                onClose={() => {
                  setVisibleNegoModal(false);
                  setFormStep(1);
                  setFormError(null);
                  setFormSuccess(false);
                }}
              >
                <StyledHeading
                  text={
                    formStep === 1
                      ? "Votre proposition"
                      : "Finalisez votre candidature"
                  }
                  style={{ marginBottom: 15 }}
                />
                <FormikForm
                  initialValues={initialFormValues}
                  validationSchema={
                    formStep === 1
                      ? serviceApplicationStep1Schema
                      : serviceApplicationSchema
                  }
                  enableReinitialize
                  onSubmit={(values, helpers) => {
                    if (formStep === 1) {
                      setFormStep(2);
                    } else {
                      handleApplicationSubmit(values, helpers);
                    }
                  }}
                >
                  {(formik) => (
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {formStep === 1 && (
                        <>
                          <FormInput
                            name="newDuration"
                            label="New duration (days)"
                            keyboardType="numeric"
                          />
                          <Divider />
                          {formik.values.tasks.map((task, idx) => (
                            <FormInput
                              key={task.taskId}
                              name={`tasks[${idx}].newPrice`}
                              label={`Price for: ${request.serviceTasks[idx].title}`}
                              keyboardType="numeric"
                            />
                          ))}
                        </>
                      )}
                      {formStep === 2 && (
                        <>
                          <FormStyledDatePicker
                            name="startDate"
                            label="Start date"
                            mode="date"
                          />
                          <FormRichTextBox
                            name="message"
                            label="Message to client"
                            placeholder="Explain your motivation, questions, etc."
                            minHeight={100}
                          />
                        </>
                      )}
                      {formError && (
                        <AlertComponent
                          status="danger"
                          title="Error"
                          description={formError}
                        />
                      )}
                      {formSuccess && (
                        <AlertComponent
                          status="success"
                          title="Success"
                          description="Your application has been sent!"
                        />
                      )}
                      <StyledButton
                        text={
                          formStep === 1
                            ? "Confirm"
                            : formLoading
                            ? "Sending..."
                            : "Submit application"
                        }
                        onPress={formik.handleSubmit}
                        color="primary"
                        style={{ marginTop: 15 }}
                        disabled={formLoading}
                      />
                      {formStep === 2 && (
                        <StyledButton
                          text="Back"
                          onPress={() => setFormStep(1)}
                          color="white"
                          style={{ marginTop: 5 }}
                        />
                      )}
                    </ScrollView>
                  )}
                </FormikForm>
              </BottomModal>
            </>
          ))}

      {/* Review Modal */}
      <BottomModal
        visible={visibleReviewModal}
        onClose={() => {
          setVisibleReviewModal(false);
          setReviewError(null);
          setReviewSuccess(false);
        }}
        height={500}
      >
        <StyledHeading
          text="Add Review"
          style={{ marginBottom: 20, textAlign: "center" }}
        />
        <FormikForm
          initialValues={{
            rating: 0,
            comment: "",
          }}
          validationSchema={reviewSchema}
          onSubmit={handleReviewSubmit}
        >
          {(formik) => (
            <ScrollView showsVerticalScrollIndicator={false}>
              <FormStarRating
                name="rating"
                label="Review note"
                size={36}
              />
              
              <Divider />
              
              <FormRichTextBox
                name="comment"
                label="Your comment"
                placeholder="Tell us about your experience with this service..."
                minHeight={120}
                maxLength={500}
              />
              
              {reviewError && (
                <AlertComponent
                  status="danger"
                  title="Error"
                  description={reviewError}
                  style={{ marginTop: 10 }}
                />
              )}
              
              {reviewSuccess && (
                <AlertComponent
                  status="success"
                  title="Success"
                  description="Your review has been submitted successfully!"
                  style={{ marginTop: 10 }}
                />
              )}
              
              <StyledButton
                text={reviewLoading ? "Submitting..." : "Submit Review"}
                onPress={formik.handleSubmit}
                color="primary"
                style={{ marginTop: 20 }}
                disabled={reviewLoading}
              />
            </ScrollView>
          )}
        </FormikForm>
      </BottomModal>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  applicationCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  applicationCountText: {
    fontSize: 14,
    fontWeight: "600",
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
  tasksHeading: { marginTop: 30, alignSelf: "center" },
  imagesContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
    paddingHorizontal: 15,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: mystyles.borderRadius,
    elevation: 5,
    flexShrink: 0,
  },
  hiddenImage: {
    opacity: 0,
  },
  tasksSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  taskHeading: {
    fontSize: 20,
    marginLeft: 5,
  },
  taskCard: {
    marginBottom: 10,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  totalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageContainer: {
    width: "90%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  imageWrapper: {
    position: "relative",
    width: 120,
    height: 120,
  },
  imageLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: mystyles.borderRadius,
  },
  buttonContainer: {
    marginBottom: 15,
  },
  postulerButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  negotiateButton: {},
  viewApplicationsButton: {
    marginBottom: 10,
  },
  addReviewButton: {
    width: "100%",
  },
  applicationCountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: colors.accentLight3,
    borderRadius: 20,
    alignSelf: "center",
  },
  applicationCountText: {
    fontSize: 14,
    fontWeight: "600",
  },
  taskCard: {
    marginBottom: 16,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  taskNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  taskNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  taskTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.8,
  },
  taskPricingContainer: {
    gap: 12,
  },
  priceComparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  originalPriceSection: {
    flex: 1,
    alignItems: "center",
  },
  proposedPriceSection: {
    flex: 1,
    alignItems: "center",
  },
  arrowContainer: {
    padding: 8,
  },
  priceSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    opacity: 0.8,
  },
  strikethroughContainer: {
    position: "relative",
    alignSelf: "center",
  },
  strikethroughLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    zIndex: 1,
  },
  originalPriceValue: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.7,
  },
  proposedPriceValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  savingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.success + "15",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "center",
  },
  savingsText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success,
  },
  singlePriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  singlePriceText: {
    fontSize: 18,
    fontWeight: "700",
  },
  totalComparisonContainer: {
    gap: 12,
  },
  originalTotalText: {
    fontSize: 18,
    fontWeight: "600",
    opacity: 0.7,
  },
  proposedTotalText: {
    fontSize: 22,
    fontWeight: "700",
  },
});
