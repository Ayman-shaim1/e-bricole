import React from 'react';
import { View } from 'react-native';
import { Formik } from 'formik';

/**
 * A reusable Formik form component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.initialValues - Initial form values
 * @param {Object} props.validationSchema - Yup validation schema
 * @param {Function} props.onSubmit - Form submission handler
 * @param {Function} props.children - Render function for form fields
 * @param {Object} props.formikProps - Additional props for Formik
 */
export default function FormikForm({
  initialValues,
  validationSchema,
  onSubmit,
  children,
  ...formikProps
}) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnChange={true}
      validateOnBlur={true}
      {...formikProps}
    >
      {(formikProps) => (
        <View style={{ width: '100%' }}>
          {typeof children === 'function' ? children(formikProps) : children}
        </View>
      )}
    </Formik>
  );
}
