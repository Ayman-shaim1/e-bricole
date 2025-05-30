import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useField } from "formik";
import StyledDatePicker from "./StyledDatePicker";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";

/**
 * A reusable form date picker component that integrates with Formik
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Field name in Formik
 * @param {string} props.label - Label text
 * @param {Object} props.icon - Icon source
 * @param {string} props.mode - Date picker mode: "date", "time", or "datetime"
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.width - Width of the component (default: "100%")
 * @param {Object} props.labelProps - Additional props for the label
 * @param {Object} props.datePickerProps - Additional props for the date picker
 * @param {Object} props.containerStyle - Additional styles for the container
 * @param {string} props.minDate - Minimum selectable date (format: MM/DD/YYYY)
 * @param {Function} props.onDateChange - Callback function to trigger when date changes (for validation)
 */
export default function FormStyledDatePicker({
  name,
  label,
  icon,
  mode = "date",
  placeholder = "Select date/time",
  width = "100%",
  labelProps = {},
  datePickerProps = {},
  containerStyle = {},
  minDate = null,
  onDateChange,
}) {
  // Use Formik's useField hook to connect to form state
  const [field, meta, helpers] = useField(name);

  return (
    <View style={[styles.container, { width }, containerStyle]}>
      {label && <StyledLabel text={label} {...labelProps} />}

      <StyledDatePicker
        value={field.value}
        onChange={(dateTimeString) => {
          helpers.setValue(dateTimeString);
          helpers.setTouched(true);
          // Trigger form validation for cross-field validation
          if (onDateChange) {
            setTimeout(() => onDateChange(), 100);
          }
        }}
        icon={icon}
        mode={mode}
        placeholder={placeholder}
        width={width}
        minDate={minDate}
        {...datePickerProps}
      />

      {meta.touched && meta.error ? (
        <Text style={styles.errorText}>{meta.error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // width removed - now controlled by width prop
  },
  errorText: {
    color: colors.error || "#FF3B30",
    fontSize: 12,
    marginBottom: 5,
    paddingHorizontal: 5,
    fontFamily: "Poppins-Regular",
  },
});
