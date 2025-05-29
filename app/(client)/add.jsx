import { StyleSheet, View, Alert, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
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
import FormStyledAddressPicker from "../../components/FormStyledAddressPicker";
import useGeolocation from "../../hooks/useGeolocation";

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
  
  // Get user's current location
  const { location, error: locationError, isLoading: locationLoading } = useGeolocation();
  
  const getInitialValues = () => ({
    title: "",
    description: "",
    serviceType: "",
    address: location ? {
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      timestamp: Date.now(),
    } : null,
    startDate: "",
    endDate: "",
    totalPrice: 0.0,
  });

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

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <View style={{ marginBottom: 0 }}>
          <StyledHeading text={"Request something new"} />
          <StyledText
            text={"Please provide the necessary information for your service."}
          />
        </View>

        <FormikForm
          key={location ? 'with-location' : 'no-location'}
          initialValues={getInitialValues()}
          validationSchema={addRequestSchema}
          onSubmit={handleRegister}
          enableReinitialize={true}
        >
          {({ isSubmitting, setFieldValue }) => (
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
                <FormStyledAddressPicker 
                  name="address"
                  label="address :"
                  useLabel={false}
                  addressPickerProps={{
                    coordinates: location ? {
                      latitude: location.latitude,
                      longitude: location.longitude,
                    } : null,
                    error: locationError,
                    isLoading: locationLoading,
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
                  />
                  <FormStyledDatePicker
                    name="endDate"
                    label="end date :"
                    mode="date"
                    placeholder="Select end date"
                    icon={CALANDRIER_ICON}
                    width="100%"
                    containerStyle={styles.datePickerHalf}
                  />
                </View>

                <FormInput
                  name="totalPrice"
                  label="total price (MAD) :"
                  placeholder="e.g. 20 MAD"
                  keyboardType="numeric"
                />
              </StyledCard>

              <FormButton
                text={isSubmitting ? "registering..." : "register"}
                disabled={isSubmitting}
              />
            </>
          )}
        </FormikForm>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
