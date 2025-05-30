import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useField } from "formik";
import StyledImagePicker from "./StyledImagePicker";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";

/**
 * A reusable form image picker component that integrates with Formik
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Field name in Formik
 * @param {string} props.label - Label text
 * @param {Object} props.customLabel - Custom label object with title and subtitle
 * @param {Object} props.labelProps - Additional props for the label
 * @param {Object} props.imagePickerProps - Additional props for the image picker
 */
export default function FormikImagePicker({
  name,
  label,
  customLabel,
  labelProps = {},
  imagePickerProps = {},
}) {
  // Use Formik's useField hook to connect to form state
  const [field, meta, helpers] = useField(name);

  return (
    <View style={[styles.container]}>
      {label && <StyledLabel text={label} {...labelProps} />}

      <StyledImagePicker
        image={field.value}
        onImageChange={(image) => {
          helpers.setValue(image);
          helpers.setTouched(true);
        }}
        customLabel={customLabel}
        {...imagePickerProps}
      />

      {meta.touched && meta.error ? (
        <Text style={styles.errorText}>{meta.error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  errorText: {
    color: colors.error || "#FF3B30",
    fontSize: 12,
    marginBottom: 5,
    paddingHorizontal: 5,
    fontFamily: "Poppins-Regular",
  },
}); 