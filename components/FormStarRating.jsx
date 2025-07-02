import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useField } from "formik";
import StarRating from "./StarRating";
import { colors } from "../constants/colors";

/**
 * A form star rating component that integrates with Formik
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Field name in Formik
 * @param {string} props.label - Label text
 * @param {number} props.size - Size of the stars
 * @param {boolean} props.readonly - Whether the rating is readonly
 * @param {Object} props.starRatingProps - Additional props for the StarRating component
 */
export default function FormStarRating({
  name,
  label,
  size = 32,
  readonly = false,
  starRatingProps = {},
}) {
  // Use Formik's useField hook to connect to form state
  const [field, meta, helpers] = useField(name);

  const handleRatingChange = (newRating) => {
    helpers.setValue(newRating);
    helpers.setTouched(true);
  };

  return (
    <View style={styles.container}>
      <StarRating
        rating={field.value || 0}
        onRatingChange={handleRatingChange}
        label={label}
        size={size}
        readonly={readonly}
        {...starRatingProps}
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
    marginBottom: 15,
  },
  errorText: {
    color: colors.danger || "#FF3B30",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 5,
    fontFamily: "Poppins-Regular",
  },
}); 