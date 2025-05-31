import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import FormikForm from "../../components/FormikForm";
import { addRequestSchema } from "../../utils/validators";
import FormInput from "../../components/FormInput";
import StyledCard from "../../components/StyledCard";
import FormRichTextBox from "../../components/FormRichTextBox";
import FormButton from "../../components/FormButton";
import { getServicesTypes } from "../../services/serviceTypesService";
import FormikDropdown from "../../components/FormikDropdown";
import FormStyledDatePicker from "../../components/FormStyledDatePicker";
import useGeolocation from "../../hooks/useGeolocation";
import FormAddressPicker from "../../components/FormAddressPicker";
import FormikMultiImagePicker from "../../components/FormikMultiImagePicker";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";

const EMAIL_ICON = require("../../assets/icons/email.png");
const PASSWORD_ICON = require("../../assets/icons/key.png");
const USER_ICON = require("../../assets/icons/user.png");
const DIPLOME_ICON = require("../../assets/icons/diplome.png");
const CALANDRIER_ICON = require("../../assets/icons/calendrier.png");
const PROFESION_ICON = require("../../assets/icons/professions-et-emplois.png");
const SKILLS_ICON = require("../../assets/icons/competences.png");
const SERVICE_ICON = require("../../assets/icons/service.png");

const FieldLabel = ({ text }) => {
  return <Text style={styles.fieldLabel}>{text}</Text>;
};

export default function AddScreen() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const formRef = useRef(null);
  const [totalPrice, setTotalPrice] = useState("0");

  // Get user's current location
  const { location, isLoading: locationLoading } = useGeolocation();

  const getInitialValues = () => {
    // Get today's date
    const today = new Date();
    const todayFormatted = `${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${today
      .getDate()
      .toString()
      .padStart(2, "0")}/${today.getFullYear()}`;

    // Get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = `${(tomorrow.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${tomorrow
      .getDate()
      .toString()
      .padStart(2, "0")}/${tomorrow.getFullYear()}`;

    const initialTask = {
      id: 1,
      title: "",
      description: "",
      price: "",
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
      startDate: todayFormatted,
      endDate: tomorrowFormatted,
      totalPrice: 0,
      images: [],
      tasks: [],
      taskForms: [initialTask],
    };
  };

  const updateTotalPrice = (tasks) => {
    if (!tasks || tasks.length === 0) return "0";
    
    const total = tasks.reduce((sum, task) => {
      if (!task) return sum;
      const price = task.price
        ? parseFloat(task.price.toString().replace(",", "."))
        : 0;
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    setTotalPrice(total.toFixed(2));
    return total.toFixed(2);
  };

  const handlePriceChange = (text, taskIndex, setFieldValue) => {
    try {
      // Format input to only allow numbers and one comma
      const formatted = text
        ? text.replace(/[^0-9,]/g, "").replace(/(,.*),/g, "$1")
        : "0";
  
      // Get current tasks
      const currentForms = formRef.current.values.taskForms || [];
      if (taskIndex < 0 || taskIndex >= currentForms.length) return;

      const updatedForms = [...currentForms];
      
      // Update price for specific task
      updatedForms[taskIndex] = {
        ...updatedForms[taskIndex],
        price: formatted
      };
      
      // Update form values
      setFieldValue(`taskForms.${taskIndex}.price`, formatted);
      
      // Update total price
      const newTotal = updateTotalPrice(updatedForms);
      setFieldValue("totalPrice", newTotal);
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  const handleAddTaskForm = (setFieldValue) => {
    const currentForms = formRef.current.values.taskForms || [];
    const newForm = {
      id: currentForms.length + 1,
      title: "",
      description: "",
      price: "0",
    };
    const updatedForms = [...currentForms, newForm];
    setFieldValue("taskForms", updatedForms);
    
    // Initialize total price when adding new task
    const newTotalPrice = updateTotalPrice(updatedForms);
    setFieldValue("totalPrice", newTotalPrice);
  };

  const handleRemoveTaskForm = (index, setFieldValue) => {
    try {
      const currentForms = formRef.current.values.taskForms || [];
      if (index < 0 || index >= currentForms.length) return;

      const updatedForms = currentForms.filter((_, i) => i !== index);
      
      // Réindexer les IDs des tâches restantes et s'assurer que chaque tâche a un prix
      const reindexedForms = updatedForms.map((form, i) => ({
        ...form,
        id: i + 1,
        price: form.price || "0"
      }));

      // Mettre à jour les tâches
      setFieldValue("taskForms", reindexedForms);
      
      // Mettre à jour le prix total après un court délai pour s'assurer que les valeurs sont à jour
      setTimeout(() => {
        const newTotalPrice = updateTotalPrice(reindexedForms);
        setFieldValue("totalPrice", newTotalPrice);
      }, 0);
    } catch (error) {
      console.error("Error removing task:", error);
    }
  };

  const handleSubmiteForm = async (values, { setSubmitting, resetForm }) => {
    try {
      console.log("handleSubmiteForm started");
      setSubmitting(true);
      console.log("Form values:", JSON.stringify(values, null, 2));

      // Transform taskForms into tasks for submission
      const processedTasks = values.taskForms.map((task) => ({
        title: task.title || "",
        description: task.description || "",
        price: task.price
          ? parseFloat(task.price.toString().replace(",", "."))
          : 0,
      }));

      // Update tasks array
      values.tasks = processedTasks;

      // Calculate final total price from tasks
      const finalTotalPrice = updateTotalPrice(processedTasks);
      values.totalPrice = finalTotalPrice;

      console.log("Processed values:", {
        tasks: values.tasks,
        taskForms: values.taskForms,
        totalPrice: values.totalPrice,
      });

      console.log(
        "Final values before submission:",
        JSON.stringify(values, null, 2)
      );
      console.log("Submitting form with values:", values);

      // Show success message
      Alert.alert("Success", "Your request has been submitted successfully!", [
        {
          text: "OK",
          onPress: () => {},
        },
      ]);
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert(
        "Error",
        "An error occurred while submitting your request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const data = await getServicesTypes();
        if (data && data.length > 0) {
          // Transform data for dropdown
          const formattedServiceTypes = [
            "-- select option --",
            ...data.map((item) => item.title),
          ];
          setServiceTypes(formattedServiceTypes);
        }
      } catch (error) {
        console.error("Error fetching service types:", error);
        Alert.alert("Error", "Failed to load service types. Please try again.");
      }
    };

    fetchServiceTypes();
  }, []);

  // Set initial location when location becomes available and form is ready
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
            <View style={{ marginBottom: 0 }}>
              <StyledHeading text={"Request something new"} />
              <StyledText
                text={
                  "Please provide the necessary information for your service."
                }
              />
            </View>

            <FormikForm
              initialValues={getInitialValues()}
              validationSchema={addRequestSchema}
              onSubmit={handleSubmiteForm}
              enableReinitialize={false}
              innerRef={formRef}
            >
              {({
                isSubmitting,
                setFieldValue,
                validateField,
                errors,
                touched,
                handleSubmit,
                values,
                setFieldTouched,
              }) => (
                <StyledCard>
                  <View>
                    <Text style={styles.fieldLabel}>Request Title</Text>
                    <FormInput
                      name="title"
                      placeholder="e.g. Full Apartment Cleaning"
                      onBlur={() => setFieldTouched("title", true)}
                    />
                  </View>

                  <View>
                    <Text style={styles.fieldLabel}>Request Description</Text>
                    <FormRichTextBox
                      name="description"
                      placeholder="e.g. Need apartment cleaning, 3 bedrooms, kitchen and bathrooms included"
                      minHeight={150}
                      maxLength={1000}
                      numberOfLines={8}
                      onBlur={() => setFieldTouched("description", true)}
                    />
                  </View>

                  <View style={styles.addressPickerContainer}>
                    <Text style={styles.fieldLabel}>Service Location</Text>
                    <FormAddressPicker
                      name="address"
                      useLabel={false}
                      isLoading={locationLoading}
                      onPick={(selectedAddress) => {
                        setFieldValue("address", selectedAddress);
                        setFieldTouched("address", true);
                      }}
                    />
                  </View>

                  <View>
                    <Text style={styles.fieldLabel}>Service Type</Text>
                    <FormikDropdown
                      name="serviceType"
                      options={
                        serviceTypes.length > 0
                          ? serviceTypes
                          : ["-- select option --"]
                      }
                      onValueChange={() => setFieldTouched("serviceType", true)}
                    />
                  </View>

                  <View style={styles.dateRowContainer}>
                    <FormStyledDatePicker
                      name="startDate"
                      label="start date :"
                      mode="date"
                      placeholder="Select start date"
                      icon={CALANDRIER_ICON}
                      width="100%"
                      containerStyle={styles.datePickerHalf}
                      minDate={`${(new Date().getMonth() + 1)
                        .toString()
                        .padStart(2, "0")}/${new Date()
                        .getDate()
                        .toString()
                        .padStart(2, "0")}/${new Date().getFullYear()}`}
                      onDateChange={() => {
                        setTimeout(() => {
                          validateField("endDate");
                          setFieldTouched("startDate", true);
                        }, 150);
                      }}
                    />
                    <FormStyledDatePicker
                      name="endDate"
                      label="end date :"
                      mode="date"
                      placeholder="Select end date"
                      icon={CALANDRIER_ICON}
                      width="100%"
                      containerStyle={styles.datePickerHalf}
                      minDate={(() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        return `${(tomorrow.getMonth() + 1)
                          .toString()
                          .padStart(2, "0")}/${tomorrow
                          .getDate()
                          .toString()
                          .padStart(2, "0")}/${tomorrow.getFullYear()}`;
                      })()}
                      onDateChange={() => {
                        setTimeout(() => {
                          validateField("startDate");
                          validateField("endDate");
                          setFieldTouched("endDate", true);
                        }, 150);
                      }}
                    />
                  </View>

                  <FormikMultiImagePicker
                    name="images"
                    label="images :"
                    maxImages={5}
                    onImagesChange={(images) => {
                      setFieldValue("images", images);
                      setFieldTouched("images", true);
                    }}
                  />

                  <View style={styles.taskSection}>
                    <View style={styles.taskSectionHeader}>
                      <Text style={[styles.fieldLabel, { marginTop: 0 }]}>
                        Tasks List
                      </Text>
                      <TouchableOpacity
                        style={styles.addTaskButton}
                        onPress={() => handleAddTaskForm(setFieldValue)}
                      >
                        <Ionicons
                          name="add-circle"
                          size={32}
                          color={colors.white}
                        />
                      </TouchableOpacity>
                    </View>

                    {errors.taskForms &&
                      typeof errors.taskForms === "string" && (
                        <Text style={styles.fieldError}>
                          {errors.taskForms}
                        </Text>
                      )}

                    {formRef.current?.values.taskForms.map((form, index) => (
                      <StyledCard key={form.id} style={styles.taskForm}>
                        <View style={styles.taskFormHeader}>
                          <Text style={[styles.fieldLabel, { marginTop: 0 }]}>
                            Task {index + 1}
                          </Text>
                          {formRef.current.values.taskForms.length > 1 && (
                            <TouchableOpacity
                              style={styles.removeTaskFormButton}
                              onPress={() =>
                                handleRemoveTaskForm(index, setFieldValue)
                              }
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color={colors.white}
                              />
                            </TouchableOpacity>
                          )}
                        </View>

                        <View>
                          <Text style={styles.fieldLabel}>Task Title</Text>
                          <FormInput
                            name={`taskForms.${index}.title`}
                            placeholder="Enter task title"
                            onBlur={() =>
                              setFieldTouched(`taskForms.${index}.title`, true)
                            }
                          />
                        </View>

                        <View>
                          <Text style={styles.fieldLabel}>
                            Task Description
                          </Text>
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
                          />
                        </View>

                        <View>
                          <Text style={styles.fieldLabel}>
                            Task Price (MAD)
                          </Text>
                          <FormInput
                            name={`taskForms.${index}.price`}
                            placeholder="Enter task price"
                            keyboardType="decimal-pad"
                            onChangeText={(text) => {
                              handlePriceChange(text, index, setFieldValue);
                              setFieldTouched(`taskForms.${index}.price`, true);
                            }}
                            value={values.taskForms?.[index]?.price || "0"}
                          />
                        </View>
                      </StyledCard>
                    ))}
                  </View>

                  {errors.submit && (
                    <Text style={[styles.fieldError, styles.submitError]}>
                      {errors.submit}
                    </Text>
                  )}

                  <FormButton
                    text="Submit Request"
                    isLoading={isSubmitting}
                    onPress={() => {
                      // Mark all fields as touched to show validation errors
                      Object.keys(values).forEach((fieldName) => {
                        setFieldTouched(fieldName, true);
                      });

                      // For nested taskForms fields
                      values.taskForms.forEach((_, index) => {
                        setFieldTouched(`taskForms.${index}.title`, true);
                        setFieldTouched(`taskForms.${index}.description`, true);
                        setFieldTouched(`taskForms.${index}.price`, true);
                      });

                      handleSubmit();
                    }}
                  />
                </StyledCard>
              )}
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
  },
  dateRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  datePickerHalf: {
    flex: 1,
  },
  addressPickerContainer: {
    width: "100%",
    marginVertical: 8,
  },
  taskSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
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
  taskFormTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.light.textColor,
  },
  removeTaskFormButton: {
    backgroundColor: colors.danger,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  totalPriceContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: colors.light.cardBackground,
  },
  totalPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalPriceLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.light.textColor,
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.light.errorBackground,
    borderRadius: 4,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
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
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textColor,
    marginBottom: 8,
    marginTop: 12,
  },
});
