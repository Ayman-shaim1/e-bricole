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
const FormikDropDown = ({
  name,
  label,
  icon,
  options,
  labelProps = {},
  dropdownProps = {},
}) => {
  // Use Formik's useField hook to connect to form state
  const [field, meta, helpers] = useField(name);

  // Transform options to match StyledDropdown format
  const transformedOptions = options.map(option => {
    if (typeof option === 'string') {
      return {
        value: option,
        label: option
      };
    }
    return {
      value: option.id || option.value,
      label: option.text || option.label,
      icon: option.icon,
      image: option.image
    };
  });

  // Find the selected option text
  const selectedOption = transformedOptions.find(option => 
    option.value === field.value
  );
  
  // If no value is selected, show the placeholder text from the first option
  const selectedOptionText = field.value ? (selectedOption?.label || '') : transformedOptions[0]?.label || '';

  const handleOptionSelect = (value) => {
    // If the value is an object, extract just the value part
    const actualValue = typeof value === 'object' ? value.value : value;
    helpers.setValue(actualValue);
    helpers.setTouched(true);
  };

  // Show error if field is touched and either has no value or is set to the default option
  const showError = meta.touched && meta.error && 
    (!field.value || field.value === "" || selectedOptionText === "-- select option --");

  return (
    <View style={[styles.container]}>
      {label && <StyledLabel text={label} {...labelProps} />}

      <StyledDropdown
        icon={icon}
        options={transformedOptions}
        selectedOption={field.value}
        selectedOptionText={selectedOptionText}
        setOption={handleOptionSelect}
        {...dropdownProps}
      />

      {showError ? (
        <Text style={styles.errorText}>{meta.error}</Text>
      ) : null}
    </View>
  );
};

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

export default FormikDropDown;
