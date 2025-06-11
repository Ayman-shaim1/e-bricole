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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

export default function AddScreen() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState([
    { value: "-- select option --", label: "-- select option --" },
  ]);
  const [serviceTypeMap, setServiceTypeMap] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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
                                    value={task.price || "0"}
                                    editable={!isLoading}
                                  />
                                </View>
                              </View>
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
});
