import { Image, ScrollView, StyleSheet, View } from "react-native";
import React, { useState } from "react";
import ThemedView from "../../components/ThemedView";
import StyledText from "../../components/StyledText";
import StyledHeading from "../../components/StyledHeading";
import StyledTextInput from "../../components/StyledTextInput";
import StyledLabel from "../../components/StyledLabel";
import StyledButton from "../../components/StyledButton";
import GoBackButton from "../../components/GoBackButton";
import StyledImagePicker from "../../components/StyledImagePicker";
import StyledUiSwitch from "../../components/StyledUiSwitch";
import { registerUser } from "../../services/authService";

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
  const [activeTab, setActiveTab] = useState("client");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passoword, setPassword] = useState("");

  const registerHandler = async () => {
    const result = await registerUser({
      name: name,
      email: email,
      password: passoword,
      isClient: false,
    });

    if (result.success) {
      alert("Inscription réussie !");
    } else {
      alert("Erreur : " + result.error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
        <StyledImagePicker />
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
            <StyledTextInput
              placeholder={"e.g. electrician"}
              icon={SERVICE_ICON}
            />

            <StyledLabel text={"profession :"} />
            <StyledTextInput
              placeholder={"e.g. electrician"}
              icon={PROFESION_ICON}
            />

            <StyledLabel text={"experience Years :"} />
            <StyledTextInput
              placeholder={"e.g. 3 years"}
              icon={CALANDRIER_ICON}
            />

            <StyledLabel text={"diploma/certficat :"} />
            <StyledTextInput
              placeholder={"e.g. plumbing Qualification Certificate"}
              icon={DIPLOME_ICON}
            />

            <StyledLabel text={"skills :"} />
            <StyledTextInput
              placeholder={"e.g. Plumbing, Electrical work, Painting"}
              icon={SKILLS_ICON}
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

        <StyledButton text={"register"} onPress={registerHandler} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  container: { flex: 1 },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginTop: 50,
    marginBottom: 20,
  },
  texts: { marginBottom: 26, justifyContent: "center", alignItems: "center" },
  singUpBtnText: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 7,
  },
});
