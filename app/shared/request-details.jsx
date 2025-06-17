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
import { useLocalSearchParams } from "expo-router";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import StyledCard from "../../components/StyledCard";
import GoBackButton from "../../components/GoBackButton";
import StyledButton from "../../components/StyledButton";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { getRequestById } from "../../services/requestService";
import StatusBadge from "../../components/StatusBadge";
import Divider from "../../components/Divider";
import { displayedSplitText } from "../../utils/displayedSplitText";
import { styles as mystyles } from "../../constants/styles";
import ImageSkeleton from "../../components/ImageSkeleton";
import { useAuth } from "../../context/AuthContext";
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
import { useRouter } from "expo-router";

export default function RequestDetailsScreen() {
  const { id, onJobApplied } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [visibleNegoModal, setVisibleNegoModal] = useState(false);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequestDetails();
  }, []);

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
    if (!id || !user) return;
    setCheckingApplied(true);
    hasUserAppliedToRequest(id, user.$id)
      .then(setAlreadyApplied)
      .finally(() => setCheckingApplied(false));
  }, [id, user]);

  if (loading) {
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
        {user?.isClient && (
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
          <View style={styles.imagesContainer}>
            {request.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => openImage(image)}
                style={styles.imageWrapper}
              >
                {!imageLoadingStates[index] && (
                  <ImageSkeleton width={150} height={150} />
                )}
                <Image
                  style={[
                    styles.image,
                    !imageLoadingStates[index] && styles.hiddenImage,
                  ]}
                  source={{ uri: image }}
                  resizeMode="cover"
                  onLoad={() => handleImageLoad(index)}
                />
              </TouchableOpacity>
            ))}
          </View>
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
          request.serviceTasks.map((task) => (
            <StyledCard key={task.$id}>
              <View style={styles.taskTitleRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color={colors.primary}
                />
                <StyledHeading text={task.title} />
              </View>
              <StyledText
                text={task.description}
                style={{ marginVertical: 10 }}
              />
              <View style={styles.priceRow}>
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={colors.primary}
                />
                <StyledHeading
                  text={task.price + " $"}
                  style={styles.priceText}
                />
              </View>
            </StyledCard>
          ))}
        {request.serviceTasks && request.serviceTasks.length > 0 && (
          <StyledCard>
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
                  ) + " $"
                }
                style={styles.totalPrice}
              />
            </View>
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
    flexWrap: "wrap",
    gap: 10,
    marginTop: 15,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: mystyles.borderRadius,
    elevation: 5,
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
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  taskDescription: {
    marginLeft: 30,
    marginBottom: 10,
    color: colors.textSecondary,
  },
  taskStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: 30,
  },
  taskStatusText: {
    fontSize: 14,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  priceText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
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
    width: 150,
    height: 150,
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
    marginBottom: 20,
  },
  postulerButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  negotiateButton: {},
  viewApplicationsButton: {
    marginTop: 10,
  },
});
