import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { Formik } from "formik";

/**
 * A reusable Formik form component
 *
 * @param {Object} props - Component props
 * @param {Object} props.initialValues - Initial form values
 * @param {Object} props.validationSchema - Yup validation schema
 * @param {Function} props.onSubmit - Form submission handler
 * @param {Function} props.children - Render function for form fields
 * @param {boolean} props.isLoading - Loading state of the form
 * @param {string} props.error - Global form error message
 * @param {Object} props.formikProps - Additional props for Formik
 */
export default function FormikForm({
  initialValues,
  validationSchema,
  onSubmit,
  children,
  isLoading = false,
  error = null,
  ...formikProps
}) {
  const handleSubmit = async (values, formikHelpers) => {
    try {
      await onSubmit(values, formikHelpers);
    } catch (err) {
      // Handle submission error
      console.error('Form submission error:', err);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      validateOnChange={false}
      validateOnBlur={true}
      {...formikProps}
    >
      {(formikProps) => (
        <View style={{ width: "100%" }}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <>
              {error && (
                <View style={{ padding: 10, backgroundColor: '#ffebee', borderRadius: 5, marginBottom: 10 }}>
                  <Text style={{ color: '#c62828' }}>{error}</Text>
                </View>
              )}
              {typeof children === "function" ? children(formikProps) : children}
            </>
          )}
        </View>
      )}
    </Formik>
  );
}
