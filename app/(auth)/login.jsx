import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import ThemedView from "../../components/ThemedView";
import StyledText from "../../components/StyledText";
import StyledHeading from "../../components/StyledHeading";
import StyledTextInput from "../../components/StyledTextInput";
import StyledLabel from "../../components/StyledLabel";
import StyledButton from "../../components/StyledButton";
import StyledLink from "../../components/StyledLink";
import DividerWithText from "../../components/DividerWithText";
import { useRouter } from "expo-router";
import { loginUser } from "../../services/authService";
import { Alert } from "react-native";

const LOGO = require("../../assets/images/logo.png");
const GOOGLE_LOGO = require("../../assets/icons/google-logo.png");
const EMAIL_ICON = require("../../assets/icons/email.png");
const PASSWORD_ICON = require("../../assets/icons/key.png");

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginHandler = async () => {
    const result = await loginUser({ email, password });

    if (result.success) {
      router.replace("/home");
    } else {
      Alert.alert(
        "Login Error",
        result.error,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );

      // alert("Erreur de connexion : " + result.error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Image source={LOGO} style={styles.logo} />
      <View style={styles.texts}>
        <StyledHeading text={"Welcome back to e-bricole"} />
        <StyledText text={"Please Sing-up here !"} />
      </View>

      <TouchableOpacity
        style={styles.singUpBtnText}
        onPress={() => router.push("/register")}
      >
        <StyledLabel text={"Dont have an account yet ?"} />
        <StyledLabel
          text={"sign-up"}
          color={"primary"}
          style={{ marginLeft: 5 }}
        />
      </TouchableOpacity>
      <StyledLabel text={"email :"} />
      <StyledTextInput
        placeholder={"e.g. j.doe@example.com"}
        icon={EMAIL_ICON}
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
      <StyledLabel text={"passoword :"} />
      <StyledTextInput
        placeholder={"***********"}
        icon={PASSWORD_ICON}
        secureTextEntry={true}
        textContentType="password"
        value={password}
        onChangeText={(text) => setPassword(text)}
      />
      <StyledButton text={"login"} onPress={loginHandler} />
      <StyledLink to="/">forget password ?</StyledLink>
      <DividerWithText text="or" />
      <StyledButton
        text={"login with google account"}
        color="white"
        image={GOOGLE_LOGO}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginTop: 50,
    marginBottom: 20,
  },
  texts: { marginBottom: 26, alignItems: "center" },
  singUpBtnText: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 7,
  },
});
