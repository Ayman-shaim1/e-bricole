import { Image, StyleSheet, TouchableOpacity, View, Alert } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import StyledText from "../../components/StyledText";
import StyledHeading from "../../components/StyledHeading";
import StyledLabel from "../../components/StyledLabel";
import StyledButton from "../../components/StyledButton";
import StyledLink from "../../components/StyledLink";
import DividerWithText from "../../components/DividerWithText";
import { useRouter } from "expo-router";
import { loginUser } from "../../services/authService";
import FormikForm from "../../components/FormikForm";
import FormInput from "../../components/FormInput";
import FormButton from "../../components/FormButton";
import { loginSchema } from "../../utils/validators";
import { useAuth } from "../../context/AuthContext";

// const LOGO = require("../../assets/images/logo.png");
const GOOGLE_LOGO = require("../../assets/icons/google-logo.png");
const EMAIL_ICON = require("../../assets/icons/email.png");
const PASSWORD_ICON = require("../../assets/icons/key.png");

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setIsAuthenticated, setUserRole } = useAuth();

  const initialValues = {
    email: "",
    password: "",
  };

  const loginHandler = async (values, { setSubmitting }) => {
    try {
      const result = await loginUser({
        email: values.email,
        password: values.password,
      });

      if (result.success) {
        // Update authentication state before navigation
        // Merge user account data with database document data (including profileImage)
        const { success, user, isClient, ...userDocData } = result;
        setUser({ ...user, ...userDocData });
        setIsAuthenticated(true);
        setUserRole(isClient);

        // Navigate based on user type
        if (result.isClient) {
          router.replace("/(client)/home");
        } else {
          router.replace("/(artisan)/dashboard");
        }
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
      }
    } catch (error) {
      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* <Image source={LOGO} style={styles.logo} /> */}
      <View style={styles.texts}>
        <StyledHeading text={"Welcome back to e-bricole"} />
        <StyledText text={"Please Sign-in here !"} />
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

      <FormikForm
        initialValues={initialValues}
        validationSchema={loginSchema}
        onSubmit={loginHandler}
      >
        {({ isSubmitting }) => (
          <>
            <FormInput
              name="email"
              label="email :"
              placeholder="e.g. j.doe@example.com"
              icon={EMAIL_ICON}
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <FormInput
              name="password"
              label="password :"
              placeholder="***********"
              icon={PASSWORD_ICON}
              secureTextEntry={true}
              textContentType="password"
            />

            <FormButton
              text={isSubmitting ? "logging in..." : "login"}
              disabled={isSubmitting}
            />

            <StyledLink to="/">forget password ?</StyledLink>
            <DividerWithText text="or" />
            <StyledButton
              text={"login with google account"}
              color="white"
              image={GOOGLE_LOGO}
            />
          </>
        )}
      </FormikForm>
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
  texts: {
    marginTop: "25%",
    marginBottom: 26,
    alignItems: "center",
  },
  singUpBtnText: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 7,
  },
});
