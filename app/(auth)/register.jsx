import { Image, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Dimensions } from "react-native";
import React, { useState, useEffect } from "react";
import ThemedView from "../../components/ThemedView";
import StyledText from "../../components/StyledText";
import StyledHeading from "../../components/StyledHeading";
import StyledTextInput from "../../components/StyledTextInput";
import StyledLabel from "../../components/StyledLabel";
import StyledButton from "../../components/StyledButton";
import GoBackButton from "../../components/GoBackButton";
import StyledImagePicker from "../../components/StyledImagePicker";
import StyledUiSwitch from "../../components/StyledUiSwitch";
import SkillsInput from "../../components/SkillsInput";
import { registerUser } from "../../services/authService";
import StyledDropdown from "../../components/StyledDropDown";
import { getServicesTypes } from "../../services/serviceTypesService";

const LOGO = require("../../assets/images/logo.png");

const EMAIL_ICON = require("../../assets/icons/email.png");
const PASSWORD_ICON = require("../../assets/icons/key.png");
const USER_ICON = require("../../assets/icons/user.png");
const DIPLOME_ICON = require("../../assets/icons/diplome.png");
const CALANDRIER_ICON = require("../../assets/icons/calendrier.png");
const PROFESION_ICON = require("../../assets/icons/professions-et-emplois.png");
const SKILLS_ICON = require("../../assets/icons/competences.png");
const SERVICE_ICON = require("../../assets/icons/service.png");

export default function Register() {
  const [activeTab, setActiveTab] = useState("artisan");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passoword, setPassword] = useState("");
  const [skills, setSkills] = useState([]);
  const [serviceType, setServiceType] = useState("-- select option --");
  const [profession, setProfession] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [serviceTypes, setServiceTypes] = useState([]);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const data = await getServicesTypes();
        if (data && data.length > 0) {
          // Transform data for dropdown
          const formattedServiceTypes = [
            "-- select option --",
            ...data.map(item => item.title)
          ];
          setServiceTypes(formattedServiceTypes);
        }
      } catch (error) {
        console.error("Error fetching service types:", error);
      }
    };

    fetchServiceTypes();
  }, []);
  const handleRegister = async () => {
    // Form validation
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }
    if (!passoword.trim() || passoword.length < 8) {
      alert("Please enter a password (minimum 8 characters)");
      return;
    }
    
    // Additional validation for artisans
    if (activeTab === "artisan") {
      if (serviceType === "-- select option --") {
        alert("Please select a service type");
        return;
      }
      if (!profession.trim()) {
        alert("Please enter your profession");
        return;
      }
    }
    
    try {
      // Show loading indicator or disable button here if needed
      
      const result = await registerUser({
        name: name,
        email: email,
        password: passoword,
        isClient: activeTab === "client",
        profileImage: profileImage, // Pass the profile image URI
        skills: skills,
        serviceType: serviceType !== "-- select option --" ? serviceType : null,
        profession: profession,
        experienceYears: experienceYears
      });

      if (result.success) {
        alert("Registration successful!");
        // You could navigate to login or home screen here
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        enabled
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
        >
          <GoBackButton />

          <Image source={LOGO} style={styles.logo} />
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
          <StyledLabel text={"photo :"} />
          <StyledImagePicker
            image={profileImage}
            onImageChange={setProfileImage}
            customLabel={{
              title: "Profile Photo",
              subtitle: "Tap to select a profile picture"
            }}
          />
          <StyledLabel text={"name :"} />
          <StyledTextInput
            placeholder={"e.g. jhon doe"}
            icon={USER_ICON}
            value={name}
            onChangeText={(text) => setName(text)}
          />
          <StyledLabel text={"email :"} />
          <StyledTextInput
            placeholder={"e.g. j.doe@example.com"}
            icon={EMAIL_ICON}
            onChangeText={(text) => setEmail(text)}
            value={email}
          />

          {activeTab === "artisan" && (
            <>
              <StyledLabel text={"service type :"} />
              <StyledDropdown
                icon={SERVICE_ICON}
                options={serviceTypes.length > 0 ? serviceTypes : ["-- select option --"]}
                selectedOption={serviceType}
                setOption={setServiceType}
              />

              <StyledLabel text={"profession :"} />
              <StyledTextInput
                placeholder={"e.g. electrician"}
                icon={PROFESION_ICON}
                value={profession}
                onChangeText={(text) => setProfession(text)}
              />

              <StyledLabel text={"experience Years :"} />
              <StyledTextInput
                placeholder={"e.g. 3"}
                icon={CALANDRIER_ICON}
                keyboardType="numeric"
                value={experienceYears}
                onChangeText={(text) => {
                  // Only allow numeric input
                  const numericText = text.replace(/[^0-9]/g, '');
                  setExperienceYears(numericText);
                }}
              />

              <StyledLabel text={"diploma/certficat :"} />
              <StyledTextInput
                placeholder={"e.g. plumbing Qualification Certificate"}
                icon={DIPLOME_ICON}
              />

              <StyledLabel text={"skills :"} />
              <SkillsInput
                placeholder={"Type a skill and press space"}
                icon={SKILLS_ICON}
                value={skills}
                onChange={setSkills}
              />
            </>
          )}

          <StyledLabel text={"passoword :"} />
          <StyledTextInput
            placeholder={"***********"}
            icon={PASSWORD_ICON}
            value={passoword}
            onChangeText={(text) => setPassword(text)}
            secureTextEntry={true}
          />

          <StyledLabel text={"confirm passoword :"} />
          <StyledTextInput
            placeholder={"***********"}
            icon={PASSWORD_ICON}
            secureTextEntry={true}
          />

          <View style={{ height: 10 }} />
          <StyledButton text={"register"} onPress={handleRegister} />
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
  texts: { marginBottom: 26, justifyContent: "center", alignItems: "center" },
  singUpBtnText: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 7,
  },
});
