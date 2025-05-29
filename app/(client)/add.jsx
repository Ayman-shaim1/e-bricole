import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
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

const EMAIL_ICON = require("../../assets/icons/email.png");
const PASSWORD_ICON = require("../../assets/icons/key.png");
const USER_ICON = require("../../assets/icons/user.png");
const DIPLOME_ICON = require("../../assets/icons/diplome.png");
const CALANDRIER_ICON = require("../../assets/icons/calendrier.png");
const PROFESION_ICON = require("../../assets/icons/professions-et-emplois.png");
const SKILLS_ICON = require("../../assets/icons/competences.png");
const SERVICE_ICON = require("../../assets/icons/service.png");

export default function AddScreen() {
  const [serviceTypes, setServiceTypes] = useState({});
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
      totalPrice: 0.0,
    };
  };

  const handleRegister = async (values, { setSubmitting, resetForm }) => {
    try {
      Alert.alert("Success", "Registration successful!", [
        { text: "OK", onPress: () => {} },
      ]);
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Error",
        "An error occurred during registration. Please try again."
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
              onSubmit={handleRegister}
              enableReinitialize={false}
              innerRef={formRef}
            >
              {({ isSubmitting, setFieldValue, values, validateForm, validateField }) => (
                <>
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

                    {/* Address picker - defaults to current location if available */}
                    <FormAddressPicker
                      name="address"
                      useLabel={false}
                      label="Adresse"
                      isLoading={locationLoading}
                      onPick={(selectedAddress) => {
                        setFieldValue("address", selectedAddress);
                      }}
                    />

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

                    <FormInput
                      name="totalPrice"
                      label="total price (MAD) :"
                      placeholder="e.g. 20,50 MAD"
                      keyboardType="decimal-pad"
                      onChangeText={(text) => {
                        // Only allow numbers and one comma
                        const formatted = text.replace(/[^0-9,]/g, '').replace(/(,.*),/g, '$1');
                        setFieldValue('totalPrice', formatted);
                      }}
                    />
                  </StyledCard>

                  <StyledCard style={{ marginBottom: 50 }}>
                    <FormButton
                      text={isSubmitting ? "registering..." : "register"}
                      disabled={isSubmitting}
                    />
                  </StyledCard>
                </>
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
});
