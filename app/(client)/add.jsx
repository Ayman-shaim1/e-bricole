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

export default function AddScreen() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const formRef = useRef(null);

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
      totalPrice: "0",
      images: [],
      tasks: [],
      taskForms: [initialTask],
    };
  };

  const calculateTotalPrice = (tasks) => {
    return tasks
      .reduce((total, task) => {
        const price = parseFloat(task.price.toString().replace(',', '.')) || 0;
        return total + price;
      }, 0)
      .toFixed(2);
  };

  const handleAddTaskForm = (setFieldValue) => {
    const currentForms = formRef.current.values.taskForms;
    const newForm = {
      id: currentForms.length + 1,
      title: "",
      description: "",
      price: "",
    };
    setFieldValue("taskForms", [...currentForms, newForm]);
  };

  const handleRemoveTaskForm = (formId, setFieldValue) => {
    const currentForms = formRef.current.values.taskForms;
    const updatedForms = currentForms.filter((form) => form.id !== formId);
    setFieldValue("taskForms", updatedForms);
  };

  const handleSubmiteForm = async (values, { setSubmitting, resetForm }) => {
    console.log("handleSubmiteForm started");
    try {
      console.log("Form submission started");
      console.log("Form values:", JSON.stringify(values, null, 2));

      // Validate that we have at least one task
      if (!values.taskForms || values.taskForms.length === 0) {
        console.log("No tasks found");
        Alert.alert("Error", "Please add at least one task");
        return;
      }

      // Transform taskForms into tasks for submission
      const processedTasks = values.taskForms.map(task => ({
        title: task.title,
        description: task.description,
        price: parseFloat(task.price.toString().replace(',', '.'))
      }));

      // Update tasks array
      values.tasks = processedTasks;

      // Calculate final total price from tasks
      const finalTotalPrice = calculateTotalPrice(processedTasks);
      values.totalPrice = finalTotalPrice;

      console.log("Processed values:", {
        tasks: values.tasks,
        taskForms: values.taskForms,
        totalPrice: values.totalPrice
      });

      // Validate that all task forms are properly filled
      const invalidTasks = values.taskForms.filter(
        (task) => !task.title || !task.description || !task.price
      );

      if (invalidTasks.length > 0) {
        console.log("Found invalid tasks");
        Alert.alert(
          "Error",
          "Please fill in all fields for each task (title, description, and price)"
        );
        return;
      }

      // Validate that all prices are valid numbers
      const invalidPrices = processedTasks.filter((task) => {
        return isNaN(task.price) || task.price <= 0;
      });

      if (invalidPrices.length > 0) {
        console.log("Found invalid prices");
        Alert.alert(
          "Error",
          "Please enter valid prices (positive numbers) for all tasks"
        );
        return;
      }

      console.log("Final values before submission:", JSON.stringify(values, null, 2));

      // Your existing submission logic here
      console.log("Submitting form with values:", values);

      // Show success message
      Alert.alert("Success", "Your request has been submitted successfully!", [
        { text: "OK" },
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
              {({ isSubmitting, setFieldValue, validateField, errors, touched, handleSubmit }) => (
                <StyledCard>
                  <FormInput
                    name="title"
                    label="title :"
                    placeholder="e.g. Full Apartment Cleaning"
                  />

                  <FormRichTextBox
                    name="description"
                    label="description :"
                    placeholder="e.g. Need apartment cleaning, 3 bedrooms, kitchen and bathrooms included"
                    minHeight={150}
                    maxLength={1000}
                    numberOfLines={8}
                  />

                  <View style={styles.addressPickerContainer}>
                    <FormAddressPicker
                      name="address"
                      useLabel={false}
                      label="Adresse"
                      isLoading={locationLoading}
                      onPick={(selectedAddress) => {
                        setFieldValue("address", selectedAddress);
                      }}
                    />
                  </View>

                  <FormikDropdown
                    name="serviceType"
                    label="service type :"
                    options={
                      serviceTypes.length > 0
                        ? serviceTypes
                        : ["-- select option --"]
                    }
                  />

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
                    }}
                  />

                  <View style={styles.taskSection}>
                    <View style={styles.taskSectionHeader}>
                      <StyledText text="Tasks" style={styles.sectionTitle} />
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

                    {formRef.current?.values.taskForms.map((form) => (
                      <StyledCard key={form.id} style={styles.taskForm}>
                        <View style={styles.taskFormHeader}>
                          <StyledText
                            text={`Task ${form.id}`}
                            style={styles.taskFormTitle}
                          />
                          {formRef.current.values.taskForms.length > 1 && (
                            <TouchableOpacity
                              style={styles.removeTaskFormButton}
                              onPress={() =>
                                handleRemoveTaskForm(form.id, setFieldValue)
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
                        <FormInput
                          name={`taskForms[${form.id - 1}].title`}
                          label="Task Title:"
                          placeholder="Enter task title"
                        />
                        <FormRichTextBox
                          name={`taskForms[${form.id - 1}].description`}
                          label="Task Description:"
                          placeholder="Enter task description"
                          minHeight={100}
                          maxLength={500}
                          numberOfLines={4}
                        />
                        <FormInput
                          name={`taskForms[${form.id - 1}].price`}
                          label="Task Price (MAD):"
                          placeholder="Enter task price"
                          keyboardType="decimal-pad"
                          onChangeText={(text) => {
                            const formatted = text
                              .replace(/[^0-9,]/g, "")
                              .replace(/(,.*),/g, "$1");
                            setFieldValue(
                              `taskForms[${form.id - 1}].price`,
                              formatted
                            );
                          }}
                        />
                      </StyledCard>
                    ))}

                    {/* Total Price Display */}
                    <StyledCard style={styles.totalPriceContainer}>
                      <View style={styles.totalPriceRow}>
                        <StyledText
                          text="Total Price:"
                          style={styles.totalPriceLabel}
                        />
                        <StyledText
                          text={`${formRef.current?.values.totalPrice || "0.00"} MAD`}
                          style={styles.totalPriceValue}
                        />
                      </View>
                    </StyledCard>
                  </View>
                  
                  <FormButton 
                    text="Submit Request" 
                    isLoading={isSubmitting} 
                    onPress={handleSubmit}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPriceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light.textColor,
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  errorContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: colors.light.errorBackground,
    borderRadius: 5,
  },
  errorTitle: {
    color: colors.danger,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  errorText: {
    color: colors.danger,
    marginLeft: 10,
    marginBottom: 3,
  },
});
