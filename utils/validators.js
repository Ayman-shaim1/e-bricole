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
    .test("is-valid-service-type", "Please select a service type", value => value && value !== ""),
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
    .test("is-valid-service-type", "Please select a service type", value => value && value !== ""),
  duration: Yup.number()
    .required("Duration is required")
    .min(1, "Duration must be at least 1 day")
    .max(365, "Duration cannot exceed 365 days")
    .integer("Duration must be a whole number"),
  images: Yup.array()
    .of(Yup.string().required("Image URI is required"))
    .max(5, "Maximum 5 images allowed")
    .nullable(),
  taskForms: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.number().required(),
        title: Yup.string()
          .required("Task title is required")
          .min(3, "Task title must be at least 3 characters")
          .max(100, "Task title must be less than 100 characters"),
        description: Yup.string()
          .required("Task description is required")
          .min(10, "Task description must be at least 10 characters")
          .max(500, "Task description must be less than 500 characters"),
        price: Yup.string()
          .required("Task price is required")
          .test("is-number", "Please enter a valid number", function (value) {
            if (!value) return false;
            const numberValue = Number(value.replace(",", "."));
            return !isNaN(numberValue);
          })
          .test(
            "is-positive",
            "Price must be a positive number",
            function (value) {
              if (!value) return false;
              const numberValue = Number(value.replace(",", "."));
              return numberValue > 0;
            }
          )
          .test("min-value", "Price must be at least 1 MAD", function (value) {
            if (!value) return false;
            const numberValue = Number(value.replace(",", "."));
            return numberValue >= 1;
          }),
      })
    )
    .min(1, "At least one task is required")
    .test("all-tasks-valid", "All tasks must be valid", function (value) {
      if (!value || value.length === 0) return false;
      return value.every(
        (task) =>
          task.title &&
          task.description &&
          task.price &&
          !isNaN(Number(task.price.replace(",", "."))) &&
          Number(task.price.replace(",", ".")) > 0
      );
    }),
  totalPrice: Yup.string().nullable(),
});

export const serviceApplicationSchema = Yup.object().shape({
  newDuration: Yup.number()
    .required('La nouvelle durée est requise')
    .min(1, 'La durée doit être au moins 1 jour'),
  tasks: Yup.array()
    .of(
      Yup.object().shape({
        taskId: Yup.string().required(),
        newPrice: Yup.number()
          .required('Le prix est requis')
          .min(1, 'Le prix doit être positif'),
      })
    )
    .min(1, 'Au moins une tâche'),
  startDate: Yup.date().required('La date de début est requise'),
  message: Yup.string().required('Le message est requis').min(10, 'Le message doit contenir au moins 10 caractères'),
});

export const serviceApplicationStep1Schema = Yup.object().shape({
  newDuration: Yup.number()
    .required('New duration is required')
    .min(1, 'Duration must be at least 1 day'),
  tasks: Yup.array()
    .of(
      Yup.object().shape({
        taskId: Yup.string().required(),
        newPrice: Yup.number()
          .required('Price is required')
          .min(1, 'Price must be positive'),
      })
    )
    .min(1, 'At least one task'),
});

// Fonction pour obtenir le schéma approprié en fonction du type d'utilisateur
export const getRegisterSchema = (userType) => {
  return userType === "artisan" ? artisanRegisterSchema : clientRegisterSchema;
};
