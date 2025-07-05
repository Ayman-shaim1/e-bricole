import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import FormikForm from "../../components/FormikForm";
import FormInput from "../../components/FormInput";
import StyledCard from "../../components/StyledCard";
import FormRichTextBox from "../../components/FormRichTextBox";
import FormButton from "../../components/FormButton";
import FormikDropdown from "../../components/FormikDropdown";
import FormStyledDatePicker from "../../components/FormStyledDatePicker";
import FormAddressPicker from "../../components/FormAddressPicker";
import FormikMultiImagePicker from "../../components/FormikMultiImagePicker";
import useGeolocation from "../../hooks/useGeolocation";
import { getServicesTypes } from "../../services/serviceTypesService";
import { addRequestSchema } from "../../utils/validators";
import { colors } from "../../constants/colors";
import StyledLabel from "../../components/StyledLabel";
import { useAuth } from "../../context/AuthContext";
import { createServiceRequest } from "../../services/requestService";
import {
  predictPrice,
  areFieldsComplete,
} from "../../services/aiPredictionService";

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

export default function AddScreen() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState([
    { value: "-- select option --", label: "-- select option --" },
  ]);
  const [serviceTypeMap, setServiceTypeMap] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [predictedPrices, setPredictedPrices] = useState({}); // Stockage des prix prédits par tâche
  const [predictionLoading, setPredictionLoading] = useState({}); // Indicateurs de chargement par tâche
  const [lastRequestData, setLastRequestData] = useState({}); // Éviter les appels API dupliqués
  const [usedPredictions, setUsedPredictions] = useState({}); // Marquer les prédictions utilisées
  const formRef = useRef(null);
  const { user } = useAuth();

  // Récupérer la géolocalisation de l'utilisateur
  const { location, isLoading: locationLoading } = useGeolocation();

  // Calculer aujourd'hui et demain en format MM/DD/YYYY
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  const todayFormatted = `${mm}/${dd}/${yyyy}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dd2 = String(tomorrow.getDate()).padStart(2, "0");
  const mm2 = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const yyyy2 = tomorrow.getFullYear();
  const tomorrowFormatted = `${mm2}/${dd2}/${yyyy2}`;

  // Fonction utilitaire pour recalculer le total à partir de taskForms
  const calculateTotalFromForms = (taskForms) => {
    return taskForms.reduce((sum, task) => {
      const priceNum = parseFloat(task.price?.replace(",", ".")) || 0;
      return sum + (isNaN(priceNum) ? 0 : priceNum);
    }, 0);
  };

  // Valeurs initiales du formulaire
  const getInitialValues = () => {
    const initialTask = {
      id: 1,
      title: "",
      description: "",
      price: "0",
    };

    return {
      title: "",
      description: "",
      serviceType: "",
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
  };

  // Récupérer les types de service pour le dropdown
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const data = await getServicesTypes();
        if (data && data.length > 0) {
          // Créer un mapping des titres vers les IDs
          const mapping = {};
          data.forEach((item) => {
            mapping[item.title] = item.id;
          });
          setServiceTypeMap(mapping);

          // Créer la liste des options pour le dropdown avec valeur et label
          const options = [
            { value: "", label: "-- select option --" },
            ...data.map((item) => ({
              value: item.id,
              label: item.title,
            })),
          ];
          setServiceTypeOptions(options);

          // Stocker les données complètes
          setServiceTypes(data);
        }
      } catch (err) {
        console.error("Error fetching service types:", err);
        Alert.alert("Error", "Failed to load service types. Please try again.");
      }
    };
    fetchServiceTypes();
  }, []);

  // Lorsque la géoloc est disponible, remplir address si vide
  useEffect(() => {
    if (
      location &&
      formRef.current &&
      formRef.current.values &&
      !formRef.current.values.address
    ) {
      formRef.current.setFieldValue("address", {
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        timestamp: Date.now(),
      });
    }
  }, [location]);

  // Handle form submission
  const handleFormSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);
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
        resetForm({ values: getInitialValues() });
        setTotalPrice(0);
        setPredictedPrices({});
        setPredictionLoading({});
        setLastRequestData({});
        setUsedPredictions({});

        Alert.alert(
          "Success",
          "Your service request has been created successfully!",
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
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <View>
              <StyledHeading text="Request something new" />
              <StyledText text="Please provide the necessary information for your service." />
            </View>
            {/* Loading Indicator at bottom */}
            {isLoading && (
              <View style={styles.bottomLoadingIndicator}>
                <ActivityIndicator />
              </View>
            )}

            <FormikForm
              innerRef={formRef}
              initialValues={getInitialValues()}
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
                useEffect(() => {
                  if (!values.taskForms) return;
                  const newTotal = calculateTotalFromForms(values.taskForms);
                  setTotalPrice(newTotal);
                  setFieldValue("totalPrice", newTotal);
                }, [values.taskForms]);

                // Réinitialiser l'état "Applied" quand les données changent
                useEffect(() => {
                  if (!values.taskForms) return;

                  values.taskForms.forEach((task, index) => {
                    const taskKey = `task_${index}`;
                    const currentData = JSON.stringify({
                      titrePrestation: values.title,
                      descPrestation: values.description,
                      titreTache: task.title,
                      descTache: task.description,
                    });

                    // Si les données ont changé, réinitialiser l'état "Applied"
                    if (
                      lastRequestData[taskKey] &&
                      lastRequestData[taskKey] !== currentData
                    ) {
                      setUsedPredictions((prev) => ({
                        ...prev,
                        [taskKey]: false,
                      }));
                    }
                  });
                }, [
                  values.title,
                  values.description,
                  values.taskForms,
                  lastRequestData,
                ]);

                // Prédiction automatique des prix avec debouncing
                useEffect(() => {
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
                            console.error(
                              "❌ Prediction failed:",
                              result.error
                            );
                            setPredictedPrices((prev) => ({
                              ...prev,
                              [taskKey]: "error",
                            }));
                          }
                        } catch (error) {
                          console.error(
                            "❌ Error predicting price for task:",
                            error
                          );
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
                  }, 1000); // Debounce de 1 seconde

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
                  <StyledCard>
                    {/* Request Title */}
                    <View>
                      <StyledLabel
                        text="Request Title"
                        style={styles.fieldLabel}
                      />
                      <FormInput
                        name="title"
                        placeholder="e.g. Full Apartment Cleaning"
                        onBlur={() => setFieldTouched("title", true)}
                        editable={!isLoading}
                      />
                    </View>

                    {/* Request Description */}
                    <View>
                      <StyledLabel
                        text="Request Description"
                        style={styles.fieldLabel}
                      />
                      <FormRichTextBox
                        name="description"
                        placeholder="e.g. Need apartment cleaning, 3 bedrooms, kitchen and bathrooms included"
                        minHeight={150}
                        maxLength={1000}
                        numberOfLines={8}
                        onBlur={() => setFieldTouched("description", true)}
                        editable={!isLoading}
                      />
                    </View>

                    {/* Service Location */}
                    <View style={styles.addressPickerContainer}>
                      <StyledLabel
                        text="Service Location"
                        style={styles.fieldLabel}
                      />
                      <FormAddressPicker
                        name="address"
                        useLabel={false}
                        isLoading={locationLoading}
                        onPick={(picked) => {
                          setFieldValue("address", picked);
                          setFieldTouched("address", true);
                        }}
                        disabled={isLoading}
                      />
                    </View>

                    {/* Service Type */}
                    <View>
                      <StyledLabel
                        text="Service Type"
                        style={styles.fieldLabel}
                      />
                      <FormikDropdown
                        name="serviceType"
                        options={serviceTypeOptions}
                        valueKey="value"
                        labelKey="label"
                        disabled={isLoading}
                      />
                    </View>

                    {/* Duration Input */}
                    <View>
                      <StyledLabel
                        text="Duration (days)"
                        style={styles.fieldLabel}
                      />
                      <FormInput
                        name="duration"
                        placeholder="Enter duration in days"
                        keyboardType="numeric"
                        onBlur={() => setFieldTouched("duration", true)}
                        editable={!isLoading}
                      />
                    </View>

                    {/* Images */}
                    <FormikMultiImagePicker
                      name="images"
                      label="Images :"
                      maxImages={5}
                      onImagesChange={(imgs) => {
                        setFieldValue("images", imgs);
                        setFieldTouched("images", true);
                      }}
                      disabled={isLoading}
                    />

                    {/* Section Tâches */}
                    <View style={styles.taskSection}>
                      <View style={styles.taskSectionHeader}>
                        <StyledLabel
                          text="Tasks List"
                          style={[styles.fieldLabel, { marginTop: 0 }]}
                        />
                        <TouchableOpacity
                          style={[
                            styles.addTaskButton,
                            isLoading && styles.disabledButton,
                          ]}
                          onPress={addTaskForm}
                          disabled={isLoading}
                        >
                          <Ionicons
                            name="add-circle"
                            size={32}
                            color={colors.white}
                          />
                        </TouchableOpacity>
                      </View>

                      {values.taskForms.map((task, index) => {
                        const currentPrice =
                          parseFloat(task.price?.replace(",", ".")) || 0;
                        return (
                          <StyledCard key={task.id} style={styles.taskForm}>
                            <View style={styles.taskFormHeader}>
                              <StyledLabel
                                text={`Task ${index + 1}`}
                                style={[styles.fieldLabel, { marginTop: 0 }]}
                              />
                              {values.taskForms.length > 1 && (
                                <TouchableOpacity
                                  style={[
                                    styles.removeTaskFormButton,
                                    isLoading && styles.disabledButton,
                                  ]}
                                  onPress={() => removeTaskForm(index)}
                                  disabled={isLoading}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color={colors.white}
                                  />
                                </TouchableOpacity>
                              )}
                            </View>

                            {/* Task Title */}
                            <View>
                              <StyledLabel
                                text="Task Title"
                                style={styles.fieldLabel}
                              />
                              <FormInput
                                name={`taskForms.${index}.title`}
                                placeholder="Enter task title"
                                onBlur={() =>
                                  setFieldTouched(
                                    `taskForms.${index}.title`,
                                    true
                                  )
                                }
                                editable={!isLoading}
                              />
                            </View>

                            {/* Task Description */}
                            <View>
                              <StyledLabel
                                text="Task Description"
                                style={styles.fieldLabel}
                              />
                              <FormRichTextBox
                                name={`taskForms.${index}.description`}
                                placeholder="Enter task description"
                                minHeight={100}
                                maxLength={500}
                                numberOfLines={4}
                                onBlur={() =>
                                  setFieldTouched(
                                    `taskForms.${index}.description`,
                                    true
                                  )
                                }
                                editable={!isLoading}
                              />
                            </View>

                            {/* Task Price */}
                            <View>
                              <StyledLabel
                                text="Task Price ($)"
                                style={styles.fieldLabel}
                              />
                              <View style={styles.priceRow}>
                                <View style={styles.priceInputWrapper}>
                                  <FormInput
                                    name={`taskForms.${index}.price`}
                                    placeholder="0"
                                    keyboardType="decimal-pad"
                                    onBlur={() =>
                                      setFieldTouched(
                                        `taskForms.${index}.price`,
                                        true
                                      )
                                    }
                                    onChangeText={(text) => {
                                      setFieldValue(
                                        `taskForms.${index}.price`,
                                        text
                                      );
                                      // Réinitialiser l'état "Applied" si l'utilisateur modifie le prix
                                      const taskKey = `task_${index}`;
                                      if (usedPredictions[taskKey]) {
                                        setUsedPredictions((prev) => ({
                                          ...prev,
                                          [taskKey]: false,
                                        }));
                                      }
                                    }}
                                    value={task.price || "0"}
                                    editable={!isLoading}
                                  />
                                </View>
                              </View>

                              {/* Prédiction de prix */}
                              {(() => {
                                const taskKey = `task_${index}`;
                                const isLoadingPrediction =
                                  predictionLoading[taskKey];
                                const predictedPrice = predictedPrices[taskKey];

                                if (isLoadingPrediction) {
                                  return (
                                    <View style={styles.predictionContainer}>
                                      <LoadingIcon />
                                      <StyledText
                                        text="AI analyzing..."
                                        style={styles.predictionText}
                                      />
                                    </View>
                                  );
                                }

                                if (predictedPrice !== undefined) {
                                  // Gestion des erreurs
                                  if (predictedPrice === "error") {
                                    return (
                                      <View
                                        style={[
                                          styles.predictionContainer,
                                          styles.errorContainer,
                                        ]}
                                      >
                                        <Ionicons
                                          name="alert-circle-outline"
                                          size={16}
                                          color={colors.danger}
                                        />
                                        <StyledText
                                          text="AI Error. Check that API is running on localhost:8000"
                                          style={[
                                            styles.predictionText,
                                            styles.errorText,
                                          ]}
                                        />
                                      </View>
                                    );
                                  }

                                  // Affichage normal du prix prédit
                                  return (
                                    <View style={styles.predictionContainer}>
                                      <Ionicons
                                        name="bulb-outline"
                                        size={16}
                                        color={colors.primary}
                                      />
                                      <StyledText
                                        text={`Suggested Price: ${predictedPrice.toFixed(
                                          2
                                        )} $`}
                                        style={styles.predictionText}
                                      />
                                      {!usedPredictions[taskKey] ? (
                                        <TouchableOpacity
                                          style={styles.usePredictionButton}
                                          onPress={() => {
                                            setFieldValue(
                                              `taskForms.${index}.price`,
                                              predictedPrice.toString()
                                            );
                                            setUsedPredictions((prev) => ({
                                              ...prev,
                                              [taskKey]: true,
                                            }));
                                          }}
                                          disabled={isLoading}
                                        >
                                          <StyledText
                                            color={"white"}
                                            text="Use"
                                            style={
                                              styles.usePredictionButtonText
                                            }
                                          />
                                        </TouchableOpacity>
                                      ) : (
                                        <View
                                          style={styles.usedPredictionIndicator}
                                        >
                                          <Ionicons
                                            name="checkmark-circle-outline"
                                            size={16}
                                            color={colors.success}
                                          />
                                          <StyledText
                                            text="Applied"
                                            style={styles.usedPredictionText}
                                          />
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
                      text={isLoading ? "Adding..." : "Submit Request"}
                      isLoading={isLoading}
                      onPress={() => {
                        setFieldTouched("title", true);
                        setFieldTouched("description", true);
                        setFieldTouched("serviceType", true);
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
                      disabled={isLoading}
                    />

                    {/* Loading Indicator at bottom */}
                    {isLoading && (
                      <View style={styles.bottomLoadingIndicator}>
                        <ActivityIndicator />
                      </View>
                    )}
                  </StyledCard>
                );
              }}
            </FormikForm>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textColor,
    marginBottom: 8,
    marginTop: 12,
  },
  fieldError: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  submitError: {
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 4,
  },
  addressPickerContainer: {
    width: "100%",
    marginVertical: 8,
  },
  dateRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
  },
  datePickerHalf: {
    flex: 1,
  },
  taskSection: {
    marginTop: 20,
  },
  taskSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addTaskButton: {
    backgroundColor: colors.success,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  taskForm: {
    marginBottom: 20,
  },
  taskFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  removeTaskFormButton: {
    backgroundColor: colors.danger,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  priceInputWrapper: {
    flex: 1,
  },
  totalPriceDisplay: {
    backgroundColor: colors.light.cardBackground,
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  totalPriceLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.textColor,
  },
  totalPriceValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  topLoadingIndicator: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  bottomLoadingIndicator: {
    alignItems: "center",
  },
  predictionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.light.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + "30",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  predictionText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    flex: 1,
  },
  usePredictionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  usePredictionButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: colors.danger + "10",
    borderColor: colors.danger + "30",
  },
  errorText: {
    color: colors.danger,
  },
  usedPredictionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.success + "20",
    borderRadius: 4,
    marginLeft: 8,
  },
  usedPredictionText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
});
