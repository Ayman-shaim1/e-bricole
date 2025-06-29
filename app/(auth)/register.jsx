import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Alert,
  Text,
} from "react-native";
import React, { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import ThemedView from "../../components/ThemedView";
import StyledText from "../../components/StyledText";
import StyledHeading from "../../components/StyledHeading";
import StyledUiSwitch from "../../components/StyledUiSwitch";
import GoBackButton from "../../components/GoBackButton";
import { registerUser } from "../../services/authService";
import { getServicesTypes } from "../../services/serviceTypesService";
import FormikForm from "../../components/FormikForm";
import FormInput from "../../components/FormInput";
import FormButton from "../../components/FormButton";
import FormikDropdown from "../../components/FormikDropdown";
import FormikSkills from "../../components/FormikSkills";
import FormikImagePicker from "../../components/FormikImagePicker";
import { getRegisterSchema } from "../../utils/validators";

// const LOGO = require("../../assets/images/logo.png");

const EMAIL_ICON = require("../../assets/icons/email.png");
const PASSWORD_ICON = require("../../assets/icons/key.png");
const USER_ICON = require("../../assets/icons/user.png");
const DIPLOME_ICON = require("../../assets/icons/diplome.png");
const CALANDRIER_ICON = require("../../assets/icons/calendrier.png");
const PROFESION_ICON = require("../../assets/icons/professions-et-emplois.png");
const SKILLS_ICON = require("../../assets/icons/competences.png");
const SERVICE_ICON = require("../../assets/icons/service.png");

export default function Register() {
  const [activeTab, setActiveTab] = useState("client");
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceTypeMap, setServiceTypeMap] = useState({});

  // Initial values for the form
  const getInitialValues = () => ({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profileImage: null,
    serviceType: "",
    profession: "",
    experienceYears: "",
    skills: [],
    diploma: "",
  });

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const data = await getServicesTypes();
        if (data && data.length > 0) {
          // Transform data for dropdown
          const formattedServiceTypes = [
            { value: "", label: "-- select option --" },
            ...data.map((item) => ({
              value: item.id,
              label: item.title,
            })),
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

  const handleRegister = async (values, { setSubmitting, resetForm }) => {
    try {
      // Get expo push token before registration
      let expoPushToken = null;
      try {
        console.log("Getting expo push token during registration...");
        const tokenData = await Notifications.getExpoPushTokenAsync();
        expoPushToken = tokenData.data;
        console.log("Expo push token obtained:", expoPushToken);
      } catch (tokenError) {
        console.warn("Failed to get expo push token during registration:", tokenError.message);
        // Continue with registration even if we can't get the push token
      }

      const result = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        isClient: activeTab === "client",
        profileImage: values.profileImage,
        skills: values.skills,
        serviceType:
          values.serviceType !== "-- select option --"
            ? values.serviceType
            : null,
        profession: values.profession,
        experienceYears: values.experienceYears,
        diploma: values.diploma,
        expoPushToken: expoPushToken,
      });

      if (result.success) {
        resetForm();
        Alert.alert("Success", "Registration successful!", [
          {
            text: "OK",
            onPress: () => {
              // resetForm()
            },
          },
        ]);

        // You could navigate to login or home screen here
      } else {
        Alert.alert("Registration Error", result.error);
      }
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

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GoBackButton />
          {/* <Image source={LOGO} style={styles.logo} /> */}
          <View style={styles.texts}>
            <StyledHeading text={"Welcome to e-bricole"} />
            <StyledText
              text={
                "Create an account to get started and enjoy all our features."
              }
            />
          </View>
          <StyledUiSwitch
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            text1="client"
            text2={"artisan"}
          />
          <FormikForm
            initialValues={getInitialValues()}
            validationSchema={getRegisterSchema(activeTab)}
            onSubmit={handleRegister}
            enableReinitialize={true}
          >
            {({ isSubmitting, setFieldValue }) => (
              <>
                <FormikImagePicker
                  name="profileImage"
                  label="photo :"
                  customLabel={{
                    title: "Profile Photo",
                    subtitle: "Tap to select a profile picture",
                  }}
                />

                <FormInput
                  name="name"
                  label="name :"
                  placeholder="e.g. jhon doe"
                  icon={USER_ICON}
                />

                <FormInput
                  name="email"
                  label="email :"
                  placeholder="e.g. j.doe@example.com"
                  icon={EMAIL_ICON}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />

                {activeTab === "artisan" && (
                  <>
                    <FormikDropdown
                      name="serviceType"
                      label="service type :"
                      icon={SERVICE_ICON}
                      options={
                        serviceTypes.length > 0
                          ? serviceTypes
                          : [{ value: "", label: "-- select option --" }]
                      }
                    />

                    <FormInput
                      name="profession"
                      label="profession :"
                      placeholder="e.g. electrician"
                      icon={PROFESION_ICON}
                    />

                    <FormInput
                      name="experienceYears"
                      label="experience Years :"
                      placeholder="e.g. 3"
                      icon={CALANDRIER_ICON}
                      keyboardType="numeric"
                      inputProps={{
                        onChangeText: (text) => {
                          // Only allow numeric input
                          const numericText = text.replace(/[^0-9]/g, "");
                          setFieldValue("experienceYears", numericText);
                        },
                      }}
                    />

                    <FormInput
                      name="diploma"
                      label="diploma/certficat :"
                      placeholder="e.g. plumbing Qualification Certificate"
                      icon={DIPLOME_ICON}
                    />

                    <FormikSkills
                      name="skills"
                      label="skills :"
                      placeholder="Type a skill and press space"
                      icon={SKILLS_ICON}
                    />
                  </>
                )}

                <FormInput
                  name="password"
                  label="password :"
                  placeholder="***********"
                  icon={PASSWORD_ICON}
                  secureTextEntry={true}
                  textContentType="password"
                />

                <FormInput
                  name="confirmPassword"
                  label="confirm password :"
                  placeholder="***********"
                  icon={PASSWORD_ICON}
                  secureTextEntry={true}
                  textContentType="password"
                />

                <View style={{ height: 10 }} />
                <FormButton
                  text={isSubmitting ? "registering..." : "register"}
                  disabled={isSubmitting}
                />
              </>
            )}
          </FormikForm>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginTop: 50,
  },
  texts: {
    marginTop: "25%",
    marginBottom: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  singUpBtnText: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 7,
  },
});
