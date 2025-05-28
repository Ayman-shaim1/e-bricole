/**
 * Collection de fonctions de validation pour les formulaires
 */
import * as Yup from "yup";

/**
 * Schémas de validation Yup pour les formulaires
 */

// Login form validation schema
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

// Schéma de validation pour le formulaire d'inscription client
export const clientRegisterSchema = Yup.object().shape({
  name: Yup.string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/\d/, "Password must contain at least one number"),
  confirmPassword: Yup.string()
    .required("Password confirmation is required")
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

// Artisan registration form validation schema
export const artisanRegisterSchema = Yup.object().shape({
  name: Yup.string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  profileImage: Yup.mixed().required("Profile image is required"),
  serviceType: Yup.string()
    .required("Service type is required")
    .notOneOf(["-- select option --"], "Please select a service type"),
  profession: Yup.string().required("Profession is required"),
  experienceYears: Yup.string()
    .required("Experience years is required")
    .matches(/^\d+$/, "Please enter a valid number")
    .test(
      "is-valid-year",
      "Please enter a value between 0 and 70",
      (value) => !value || (parseInt(value) >= 0 && parseInt(value) <= 70)
    ),
  diploma: Yup.string().required("Diploma/certificate is required"),
  skills: Yup.array().min(1, "At least one skill is required"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/\d/, "Password must contain at least one number"),
  confirmPassword: Yup.string()
    .required("Password confirmation is required")
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

export const addRequestSchema = Yup.object().shape({});

// Fonction pour obtenir le schéma approprié en fonction du type d'utilisateur
export const getRegisterSchema = (userType) => {
  return userType === "artisan" ? artisanRegisterSchema : clientRegisterSchema;
};
