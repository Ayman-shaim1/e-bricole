import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useField } from "formik";
import StyledDropdown from "./StyledDropDown";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";

/**
 * A reusable form dropdown component that integrates with Formik
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Field name in Formik
 * @param {string} props.label - Label text
 * @param {Object} props.icon - Icon source
 * @param {Array} props.options - Array of dropdown options
 * @param {Object} props.labelProps - Additional props for the label
 * @param {Object} props.dropdownProps - Additional props for the dropdown
 */
export default function FormikDropdown({
  name,
  label,
  icon,
  options,
  labelProps = {},
  dropdownProps = {},
}) {
  // Use Formik's useField hook to connect to form state
  const [field, meta, helpers] = useField(name);

  return (
    <View style={[styles.container]}>
      {label && <StyledLabel text={label} {...labelProps} />}

      <StyledDropdown
        icon={icon}
        options={options}
        selectedOption={field.value}
        setOption={(value) => {
          helpers.setValue(value);
          helpers.setTouched(true);
        }}
        {...dropdownProps}
      />

      {meta.touched &&
      meta.error &&
      (!field.value || field.value === "-- select option --") ? (
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
    marginTop: 0,
    marginBottom: 5,
    paddingHorizontal: 5,
    fontFamily: "Poppins-Regular",
  },
});
