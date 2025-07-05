import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ActivityIndicator, Animated } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import Header from "../../components/Header";
import StyledCard from "../../components/StyledCard";
import StyledHeading from "../../components/StyledHeading";
import StyledLabel from "../../components/StyledLabel";
import StyledText from "../../components/StyledText";
import BottomModal from "../../components/BottomModal";
import FormikForm from "../../components/FormikForm";
import FormInput from "../../components/FormInput";
import FormRichTextBox from "../../components/FormRichTextBox";
import FormButton from "../../components/FormButton";
import FormAddressPicker from "../../components/FormAddressPicker";
import FormikMultiImagePicker from "../../components/FormikMultiImagePicker";
import { getServicesTypes } from "../../services/serviceTypesService";
import { getLastThreeRequests, createServiceRequest } from "../../services/requestService";
import { useAuth } from "../../context/AuthContext";
import useGeolocation from "../../hooks/useGeolocation";
import { addRequestSchema } from "../../utils/validators";
import { colors } from "../../constants/colors";
import {
  predictPrice,
  areFieldsComplete,
} from "../../services/aiPredictionService";
import { registerCallback } from "../shared/address-picker";

// Composant d'animation pour le loading
const LoadingIcon = () => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const fadeInOut = () => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => fadeInOut());
    };
    fadeInOut();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Ionicons name="settings-outline" size={16} color={colors.primary} />
    </Animated.View>
  );
};

const HomeScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [services, setServices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [lastRequests, setLastRequests] = React.useState([]);
  const [requestsLoading, setRequestsLoading] = React.useState(true);
  const [refreshingRequests, setRefreshingRequests] = React.useState(false);
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [totalPrice, setTotalPrice] = React.useState(0);
  const [predictedPrices, setPredictedPrices] = React.useState({});
  const [predictionLoading, setPredictionLoading] = React.useState({});
  const [lastRequestData, setLastRequestData] = React.useState({});
  const [usedPredictions, setUsedPredictions] = React.useState({});
  const [savedFormData, setSavedFormData] = React.useState(null);
  const [waitingForAddress, setWaitingForAddress] = React.useState(false);
  const formRef = useRef(null);
  
  // Récupérer la géolocalisation de l'utilisateur
  const { location, isLoading: locationLoading } = useGeolocation();

  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = await getServicesTypes();
        setServices(data);
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Function to fetch last requests (reusable)
  const fetchLastRequests = React.useCallback(async (showLoader = true) => {
    if (!user?.$id) return;
    
    try {
      if (showLoader) {
        setRequestsLoading(true);
      } else {
        setRefreshingRequests(true);
      }
      
      const result = await getLastThreeRequests(user.$id);
      if (result.success) {
        setLastRequests(result.data);
      } else {
        console.error("Error loading last requests:", result.error);
      }
    } catch (error) {
      console.error("Error loading last requests:", error);
    } finally {
      if (showLoader) {
        setRequestsLoading(false);
      } else {
        setRefreshingRequests(false);
      }
    }
  }, [user?.$id]);

  React.useEffect(() => {
    fetchLastRequests(true);
  }, [fetchLastRequests]);

  // Effect to handle returning from address picker
  useFocusEffect(
    React.useCallback(() => {
      // If we're waiting for address and have saved form data, reopen modal
      if (waitingForAddress && savedFormData && selectedService) {
        setWaitingForAddress(false);
        setIsModalVisible(true);
      }
      
      // Optionally refresh requests when coming back to screen
      // This ensures we always have the latest data
      if (!waitingForAddress && user?.$id) {
        fetchLastRequests(false);
      }
    }, [waitingForAddress, savedFormData, selectedService, user?.$id, fetchLastRequests])
  );

  // Fonction utilitaire pour recalculer le total à partir de taskForms
  const calculateTotalFromForms = (taskForms) => {
    return taskForms.reduce((sum, task) => {
      const priceNum = parseFloat(task.price?.replace(",", ".")) || 0;
      return sum + (isNaN(priceNum) ? 0 : priceNum);
    }, 0);
  };

  // Fonction pour créer des valeurs initiales vides (pour reset)
  const getEmptyInitialValues = React.useCallback(() => {
    const initialTask = {
      id: 1,
      title: "",
      description: "",
      price: "0",
    };

    return {
      title: "",
      description: "",
      serviceType: selectedService?.id || "",
      address: location
        ? {
            coordinates: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            timestamp: Date.now(),
          }
        : null,
      duration: 1,
      totalPrice: 0,
      images: [],
      tasks: [],
      taskForms: [initialTask],
    };
  }, [selectedService?.id, location]);

  // Valeurs initiales du formulaire memoized pour éviter les re-renders
  const getInitialValues = React.useMemo(() => {
    // Si on a des données sauvegardées, les utiliser
    if (savedFormData) {
      return {
        ...savedFormData,
        serviceType: selectedService?.id || savedFormData.serviceType,
      };
    }

    return getEmptyInitialValues();
  }, [savedFormData, selectedService?.id, location, getEmptyInitialValues]);

  // Function to get status color based on request status
  const getStatusColor = (status) => {
    switch (status) {
      case 'in progress':
        return '#2196F3'; // Blue
      case 'active':
        return '#4CAF50'; // Green
      case 'completed':
        return '#8BC34A'; // Light Green
      case 'pre-begin':
        return '#FFC107'; // Yellow
      case 'cancelled':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 2) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Function to handle request item press
  const handleRequestPress = (requestId) => {
    router.push(`/shared/request-details?id=${requestId}`);
  };

  // Function to handle service item press
  const handleServicePress = (service) => {
    setSelectedService(service);
    setIsModalVisible(true);
    // Reset form states only if not waiting for address
    if (!waitingForAddress) {
      setTotalPrice(0);
      setPredictedPrices({});
      setPredictionLoading({});
      setLastRequestData({});
      setUsedPredictions({});
      setSavedFormData(null);
    }
  };

  // Function to handle address picker opening
  const handleAddressPickerOpen = (formValues) => {
    // Save current form data
    setSavedFormData(formValues);
    setWaitingForAddress(true);
    
    // Close modal temporarily
    setIsModalVisible(false);
    
    // Generate callback ID and register callback
    const callbackId = `callback_${Date.now()}_${Math.random()}`;
    
    registerCallback(callbackId, (selectedAddress) => {
      // Update saved form data with new address
      setSavedFormData(prev => ({
        ...prev,
        address: selectedAddress
      }));
      
      // We'll reopen the modal when screen comes back into focus
    });
    
    // Navigate to address picker
    router.push({
      pathname: "/shared/address-picker",
      params: {
        latitude: formValues.address?.coordinates?.latitude || location?.latitude || 36.8065,
        longitude: formValues.address?.coordinates?.longitude || location?.longitude || 10.1815,
        callbackId: callbackId,
      },
    });
  };

  // Handle form submission
  const handleFormSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsSubmitting(true);
      setSubmitting(true);

      const requestData = {
        title: values.title,
        description: values.description,
        serviceType: values.serviceType,
        address: {
          coordinates: values.address.coordinates,
          textAddress: values.address.address || "",
        },
        duration: parseInt(values.duration, 10),
        totalPrice: values.totalPrice,
        images: values.images || [],
        tasks: values.taskForms.map((t) => ({
          title: t.title || "",
          description: t.description || "",
          price: parseFloat(t.price.replace(",", ".")) || 0,
        })),
        user: user.$id,
      };

      const result = await createServiceRequest(requestData);

      if (result.success) {
        resetForm({ values: getEmptyInitialValues() });
        setTotalPrice(0);
        setPredictedPrices({});
        setPredictionLoading({});
        setLastRequestData({});
        setUsedPredictions({});
        setSavedFormData(null);
        setWaitingForAddress(false);
        setIsModalVisible(false);

        // Refresh the last requests immediately
        await fetchLastRequests(false);

        Alert.alert(
          "Success",
          "Your service request has been created successfully! Your request list has been updated.",
          [{ text: "OK" }]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error("Submission error:", err);
      Alert.alert(
        "Error",
        "An error occurred while submitting your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Header />
        {/* <StyledAddressPicker useLabel={false} /> */}
        <View style={styles.content}>
          <StyledCard>
            <StyledHeading text="Popular Services" style={styles.heading} />
            {loading ? (
              <StyledText text="Loading services..." />
            ) : (
              <View style={styles.servicesContainer}>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceItem}
                    onPress={() => handleServicePress(service)}
                    activeOpacity={0.7}
                  >
                    <StyledLabel text={service.title} />
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </StyledCard>
          
          <StyledCard>
            <View style={styles.lastRequestsHeader}>
              <StyledHeading text="Last requests" style={styles.heading} />
              {refreshingRequests && (
                <View style={styles.refreshIndicator}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <StyledText text="Updating..." style={styles.refreshText} />
                </View>
              )}
            </View>
            {requestsLoading ? (
              <StyledText text="Loading requests..." />
            ) : lastRequests.length === 0 ? (
              <StyledText text="No requests yet" />
            ) : (
              lastRequests.map((request) => (
                <TouchableOpacity
                  key={request.$id}
                  style={styles.requestItem}
                  onPress={() => handleRequestPress(request.$id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.statusDot, 
                      { backgroundColor: getStatusColor(request.status) }
                    ]}
                  />
                  <View style={styles.requestInfo}>
                    <StyledLabel
                      text={request.title}
                      style={styles.requestTitle}
                    />
                    <StyledLabel
                      text={formatDate(request.$createdAt)}
                      style={styles.requestDate}
                    />
                  </View>
                  <StyledLabel 
                    text={request.status} 
                    style={[styles.requestStatus, { color: getStatusColor(request.status) }]} 
                  />
                </TouchableOpacity>
              ))
            )}
          </StyledCard>
        </View>
      </ScrollView>

      {/* Service Request Modal */}
      <BottomModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          // Only reset if not waiting for address
          if (!waitingForAddress) {
            setSelectedService(null);
            setTotalPrice(0);
            setPredictedPrices({});
            setPredictionLoading({});
            setLastRequestData({});
            setUsedPredictions({});
            setSavedFormData(null);
          }
        }}
        height={700}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalKeyboardAvoidingView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <StyledHeading text={`Request ${selectedService?.title || 'Service'}`} style={styles.modalTitle} />
              <StyledText text="Please provide the necessary information for your service." style={styles.modalSubtitle} />

              <FormikForm
                innerRef={formRef}
                initialValues={getInitialValues}
                validationSchema={addRequestSchema}
                onSubmit={handleFormSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  setFieldValue,
                  setFieldTouched,
                  handleSubmit,
                  isSubmitting,
                  resetForm,
                }) => {
                  // Recalcul du total dès que taskForms change
                  React.useEffect(() => {
                    if (!values.taskForms) return;
                    const newTotal = calculateTotalFromForms(values.taskForms);
                    setTotalPrice(newTotal);
                    setFieldValue("totalPrice", newTotal);
                  }, [values.taskForms]);

                  // Prédiction automatique des prix avec debouncing
                  React.useEffect(() => {
                    if (!values.taskForms || !values.title || !values.description)
                      return;

                    const timeoutId = setTimeout(() => {
                      values.taskForms.forEach(async (task, index) => {
                        const taskData = {
                          titrePrestation: values.title,
                          descPrestation: values.description,
                          titreTache: task.title,
                          descTache: task.description,
                        };

                        // Vérifier si tous les champs sont remplis
                        if (areFieldsComplete(taskData)) {
                          const taskKey = `task_${index}`;
                          const dataKey = JSON.stringify(taskData);

                          // Éviter les appels multiples pour les mêmes données
                          if (
                            predictionLoading[taskKey] ||
                            lastRequestData[taskKey] === dataKey
                          )
                            return;

                          setLastRequestData((prev) => ({
                            ...prev,
                            [taskKey]: dataKey,
                          }));
                          setPredictionLoading((prev) => ({
                            ...prev,
                            [taskKey]: true,
                          }));

                          try {
                            const result = await predictPrice(taskData);
                            if (result.success) {
                              setPredictedPrices((prev) => ({
                                ...prev,
                                [taskKey]: result.predictedPrice,
                              }));
                            } else {
                              setPredictedPrices((prev) => ({
                                ...prev,
                                [taskKey]: "error",
                              }));
                            }
                          } catch (error) {
                            setPredictedPrices((prev) => ({
                              ...prev,
                              [taskKey]: "error",
                            }));
                          } finally {
                            setPredictionLoading((prev) => ({
                              ...prev,
                              [taskKey]: false,
                            }));
                          }
                        }
                      });
                    }, 1000);

                    return () => clearTimeout(timeoutId);
                  }, [values.title, values.description, values.taskForms]);

                  const addTaskForm = () => {
                    const current = values.taskForms || [];
                    const newTask = {
                      id: current.length + 1,
                      title: "",
                      description: "",
                      price: "0",
                    };
                    const updated = [...current, newTask];
                    setFieldValue("taskForms", updated);
                  };

                  const removeTaskForm = (index) => {
                    const current = values.taskForms || [];
                    if (index < 0 || index >= current.length) return;
                    const filtered = current.filter((_, i) => i !== index);
                    const reindexed = filtered.map((t, i) => ({
                      ...t,
                      id: i + 1,
                      price: t.price || "0",
                    }));
                    setFieldValue("taskForms", reindexed);

                    // Nettoyer les états de prédiction
                    const cleanupStates = (setState) => {
                      setState((prev) => {
                        const newState = { ...prev };
                        delete newState[`task_${index}`];
                        // Réindexer les états restants
                        const reindexedState = {};
                        Object.keys(newState).forEach((key) => {
                          const taskIndex = parseInt(key.split("_")[1]);
                          if (taskIndex > index) {
                            reindexedState[`task_${taskIndex - 1}`] =
                              newState[key];
                          } else {
                            reindexedState[key] = newState[key];
                          }
                        });
                        return reindexedState;
                      });
                    };

                    cleanupStates(setPredictedPrices);
                    cleanupStates(setPredictionLoading);
                    cleanupStates(setLastRequestData);
                    cleanupStates(setUsedPredictions);
                  };

                  return (
                    <ScrollView 
                      showsVerticalScrollIndicator={false}
                      style={styles.modalScrollView}
                    >
                      {/* Service Type Display */}
                      <View style={styles.serviceTypeDisplay}>
                        <StyledLabel text="Service Type" style={styles.fieldLabel} />
                        <View style={styles.serviceTypeContainer}>
                          <Ionicons name="construct" size={20} color={colors.primary} />
                          <StyledText text={selectedService?.title || ''} style={styles.serviceTypeText} />
                        </View>
                      </View>

                      {/* Request Title */}
                      <View>
                        <StyledLabel text="Request Title" style={styles.fieldLabel} />
                        <FormInput
                          name="title"
                          placeholder={`e.g. ${selectedService?.title || 'Service'} Request`}
                          onBlur={() => setFieldTouched("title", true)}
                          editable={!isSubmitting}
                        />
                      </View>

                      {/* Request Description */}
                      <View>
                        <StyledLabel text="Request Description" style={styles.fieldLabel} />
                        <FormRichTextBox
                          name="description"
                          placeholder={`Describe your ${selectedService?.title || 'service'} needs...`}
                          minHeight={100}
                          maxLength={1000}
                          numberOfLines={4}
                          onBlur={() => setFieldTouched("description", true)}
                          editable={!isSubmitting}
                        />
                      </View>

                      {/* Service Location */}
                      <View style={styles.addressPickerContainer}>
                        <StyledLabel text="Service Location" style={styles.fieldLabel} />
                        <FormAddressPicker
                          name="address"
                          useLabel={false}
                          isLoading={locationLoading}
                          disabled={isSubmitting}
                          addressPickerProps={{
                            onPress: () => handleAddressPickerOpen(values),
                            shouldPick: false
                          }}
                        />
                      </View>

                      {/* Duration Input */}
                      <View>
                        <StyledLabel text="Duration (days)" style={styles.fieldLabel} />
                        <FormInput
                          name="duration"
                          placeholder="Enter duration in days"
                          keyboardType="numeric"
                          onBlur={() => setFieldTouched("duration", true)}
                          editable={!isSubmitting}
                        />
                      </View>

                      {/* Images */}
                      <FormikMultiImagePicker
                        name="images"
                        label="Images:"
                        maxImages={5}
                        onImagesChange={(imgs) => {
                          setFieldValue("images", imgs);
                          setFieldTouched("images", true);
                        }}
                        disabled={isSubmitting}
                      />

                      {/* Section Tâches */}
                      <View style={styles.taskSection}>
                        <View style={styles.taskSectionHeader}>
                          <StyledLabel text="Tasks List" style={[styles.fieldLabel, { marginTop: 0 }]} />
                          <TouchableOpacity
                            style={[styles.addTaskButton, isSubmitting && styles.disabledButton]}
                            onPress={addTaskForm}
                            disabled={isSubmitting}
                          >
                            <Ionicons name="add-circle" size={32} color={colors.white} />
                          </TouchableOpacity>
                        </View>

                        {values.taskForms.map((task, index) => {
                          return (
                            <StyledCard key={task.id} style={styles.taskForm}>
                              <View style={styles.taskFormHeader}>
                                <StyledLabel text={`Task ${index + 1}`} style={[styles.fieldLabel, { marginTop: 0 }]} />
                                {values.taskForms.length > 1 && (
                                  <TouchableOpacity
                                    style={[styles.removeTaskFormButton, isSubmitting && styles.disabledButton]}
                                    onPress={() => removeTaskForm(index)}
                                    disabled={isSubmitting}
                                  >
                                    <Ionicons name="trash-outline" size={20} color={colors.white} />
                                  </TouchableOpacity>
                                )}
                              </View>

                              {/* Task Title */}
                              <View>
                                <StyledLabel text="Task Title" style={styles.fieldLabel} />
                                <FormInput
                                  name={`taskForms.${index}.title`}
                                  placeholder="Enter task title"
                                  onBlur={() => setFieldTouched(`taskForms.${index}.title`, true)}
                                  editable={!isSubmitting}
                                />
                              </View>

                              {/* Task Description */}
                              <View>
                                <StyledLabel text="Task Description" style={styles.fieldLabel} />
                                <FormRichTextBox
                                  name={`taskForms.${index}.description`}
                                  placeholder="Enter task description"
                                  minHeight={80}
                                  maxLength={500}
                                  numberOfLines={3}
                                  onBlur={() => setFieldTouched(`taskForms.${index}.description`, true)}
                                  editable={!isSubmitting}
                                />
                              </View>

                              {/* Task Price */}
                              <View>
                                <StyledLabel text="Task Price ($)" style={styles.fieldLabel} />
                                <FormInput
                                  name={`taskForms.${index}.price`}
                                  placeholder="0"
                                  keyboardType="decimal-pad"
                                  onBlur={() => setFieldTouched(`taskForms.${index}.price`, true)}
                                  onChangeText={(text) => {
                                    setFieldValue(`taskForms.${index}.price`, text);
                                    const taskKey = `task_${index}`;
                                    if (usedPredictions[taskKey]) {
                                      setUsedPredictions((prev) => ({
                                        ...prev,
                                        [taskKey]: false,
                                      }));
                                    }
                                  }}
                                  value={task.price || "0"}
                                  editable={!isSubmitting}
                                />

                                {/* Prédiction de prix */}
                                {(() => {
                                  const taskKey = `task_${index}`;
                                  const isLoadingPrediction = predictionLoading[taskKey];
                                  const predictedPrice = predictedPrices[taskKey];

                                  if (isLoadingPrediction) {
                                    return (
                                      <View style={styles.predictionContainer}>
                                        <LoadingIcon />
                                        <StyledText text="AI analyzing..." style={styles.predictionText} />
                                      </View>
                                    );
                                  }

                                  if (predictedPrice !== undefined && predictedPrice !== "error") {
                                    return (
                                      <View style={styles.predictionContainer}>
                                        <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                                        <StyledText
                                          text={`Suggested Price: ${predictedPrice.toFixed(2)} $`}
                                          style={styles.predictionText}
                                        />
                                        {!usedPredictions[taskKey] ? (
                                          <TouchableOpacity
                                            style={styles.usePredictionButton}
                                            onPress={() => {
                                              setFieldValue(`taskForms.${index}.price`, predictedPrice.toString());
                                              setUsedPredictions((prev) => ({
                                                ...prev,
                                                [taskKey]: true,
                                              }));
                                            }}
                                            disabled={isSubmitting}
                                          >
                                            <StyledText color={"white"} text="Use" style={styles.usePredictionButtonText} />
                                          </TouchableOpacity>
                                        ) : (
                                          <View style={styles.usedPredictionIndicator}>
                                            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                                            <StyledText text="Applied" style={styles.usedPredictionText} />
                                          </View>
                                        )}
                                      </View>
                                    );
                                  }

                                  return null;
                                })()}
                              </View>
                            </StyledCard>
                          );
                        })}
                      </View>

                      {/* Total Price Display */}
                      <View style={styles.totalPriceDisplay}>
                        <StyledHeading text="Total Price:" />
                        <StyledText text={`${totalPrice.toFixed(2)} $`} />
                      </View>

                      {/* Submit Button */}
                      <FormButton
                        text={isSubmitting ? "Submitting..." : "Submit Request"}
                        isLoading={isSubmitting}
                        onPress={() => {
                          setFieldTouched("title", true);
                          setFieldTouched("description", true);
                          setFieldTouched("address", true);
                          setFieldTouched("duration", true);
                          setFieldTouched("images", true);
                          values.taskForms.forEach((_, idx) => {
                            setFieldTouched(`taskForms.${idx}.title`, true);
                            setFieldTouched(`taskForms.${idx}.description`, true);
                            setFieldTouched(`taskForms.${idx}.price`, true);
                          });
                          handleSubmit();
                        }}
                        disabled={isSubmitting}
                      />
                    </ScrollView>
                  );
                }}
              </FormikForm>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </BottomModal>
    </ThemedView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  heading: {
    marginBottom: 12,
  },
  lastRequestsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  refreshIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: "600",
  },
  servicesContainer: {
    marginTop: 8,
  },
  serviceItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Request item styles
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontWeight: "500",
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: "#666",
  },
  requestStatus: {
    fontWeight: "600",
    fontSize: 12,
    textTransform: "capitalize",
  },
  // Modal styles
  modalKeyboardAvoidingView: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingBottom: 20,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.8,
  },
  modalScrollView: {
    flex: 1,
  },
  serviceTypeDisplay: {
    marginBottom: 16,
  },
  serviceTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.primary + "10",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  serviceTypeText: {
    marginLeft: 8,
    fontWeight: "600",
    color: colors.primary,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  addressPickerContainer: {
    marginVertical: 8,
  },
  taskSection: {
    marginTop: 16,
  },
  taskSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addTaskButton: {
    backgroundColor: colors.success,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  taskForm: {
    marginBottom: 12,
    padding: 12,
  },
  taskFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  removeTaskFormButton: {
    backgroundColor: colors.danger,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  totalPriceDisplay: {
    backgroundColor: colors.primary + "10",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  disabledButton: {
    opacity: 0.5,
  },
  predictionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.primary + "10",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  predictionText: {
    marginLeft: 8,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    flex: 1,
  },
  usePredictionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  usePredictionButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  usedPredictionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.success + "20",
    borderRadius: 4,
    marginLeft: 8,
  },
  usedPredictionText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
});

