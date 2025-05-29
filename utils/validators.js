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

export const addRequestSchema = Yup.object().shape({
  title: Yup.string()
    .required("Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: Yup.string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  address: Yup.object()
    .shape({
      coordinates: Yup.object()
        .shape({
          latitude: Yup.number().required("Latitude is required"),
          longitude: Yup.number().required("Longitude is required"),
        })
        .required("Coordinates are required"),
    })
    .nullable() // Allow null during loading
    .required("Please select an address for your service"),
  serviceType: Yup.string()
    .required("Service type is required")
    .notOneOf(["-- select option --"], "Please select a service type"),
  startDate: Yup.string()
    .required("Start date is required")
    .test("is-today-or-future", "Start date cannot be in the past", function(value) {
      if (!value) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Parse the date string (format: MM/DD/YYYY)
      const dateParts = value.split('/');
      if (dateParts.length !== 3) return false;
      
      const month = parseInt(dateParts[0]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      
      const selectedDate = new Date(year, month, day);
      selectedDate.setHours(0, 0, 0, 0);
      
      return selectedDate >= today;
    }),
  endDate: Yup.string()
    .required("End date is required")
    .test("is-after-today", "End date must be after today", function(value) {
      if (!value) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Parse the date string (format: MM/DD/YYYY)
      const dateParts = value.split('/');
      if (dateParts.length !== 3) return false;
      
      const month = parseInt(dateParts[0]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      
      const selectedDate = new Date(year, month, day);
      selectedDate.setHours(0, 0, 0, 0);
      
      return selectedDate > today;
    })
    .test("is-after-start-date", "End date must be after start date", function(value) {
      const { startDate } = this.parent;
      if (!value || !startDate) return true;
      
      // Parse start date (format: MM/DD/YYYY)
      const startParts = startDate.split('/');
      if (startParts.length !== 3) return true;
      
      const startMonth = parseInt(startParts[0]) - 1;
      const startDay = parseInt(startParts[1]);
      const startYear = parseInt(startParts[2]);
      const startDateObj = new Date(startYear, startMonth, startDay);
      
      // Parse end date (format: MM/DD/YYYY)
      const endParts = value.split('/');
      if (endParts.length !== 3) return true;
      
      const endMonth = parseInt(endParts[0]) - 1;
      const endDay = parseInt(endParts[1]);
      const endYear = parseInt(endParts[2]);
      const endDateObj = new Date(endYear, endMonth, endDay);
      
      return endDateObj > startDateObj;
    }),
  totalPrice: Yup.string()
    .required("Total price is required")
    .test("is-number", "Please enter a valid number", function(value) {
      if (!value) return false;
      // Replace comma with dot and try to convert to number
      const numberValue = Number(value.replace(',', '.'));
      return !isNaN(numberValue);
    })
    .test("is-positive", "Price must be a positive number", function(value) {
      if (!value) return false;
      const numberValue = Number(value.replace(',', '.'));
      return numberValue > 0;
    })
    .test("min-value", "Price must be at least 1 MAD", function(value) {
      if (!value) return false;
      const numberValue = Number(value.replace(',', '.'));
      return numberValue >= 1;
    }),
});

// Fonction pour obtenir le schéma approprié en fonction du type d'utilisateur
export const getRegisterSchema = (userType) => {
  return userType === "artisan" ? artisanRegisterSchema : clientRegisterSchema;
};
