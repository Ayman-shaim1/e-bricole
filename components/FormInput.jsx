import React from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { useField } from "formik";
import StyledTextInput from "./StyledTextInput";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";

/**
 * A reusable form input component that integrates with Formik
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Field name in Formik
 * @param {string} props.label - Label text
 * @param {Object} props.icon - Icon source
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.keyboardType - Keyboard type
 * @param {boolean} props.secureTextEntry - Whether to hide text entry
 * @param {string} props.textContentType - Text content type for iOS
 * @param {boolean} props.editable - Whether the input is editable
 * @param {boolean} props.isLoading - Whether the input is in loading state
 * @param {Function} props.onPress - Function to call on press (for dropdowns etc.)
 * @param {Object} props.labelProps - Additional props for the label
 * @param {Object} props.inputProps - Additional props for the input
 */
export default function FormInput({
  name,
  label,
  icon,
  placeholder,
  keyboardType,
  secureTextEntry,
  textContentType,
  editable = true,
  isLoading = false,
  onPress,
  labelProps = {},
  inputProps = {},
}) {
  // Use Formik's useField hook to connect to form state
  const [field, meta, helpers] = useField(name);

  const handleChange = (text) => {
    helpers.setValue(text);
    // Only validate on blur to avoid too frequent validation
    if (meta.touched) {
      helpers.setError(undefined);
    }
  };

  const handleBlur = () => {
    helpers.setTouched(true);
  };

  return (
    <View style={[styles.container]}>
      {label && <StyledLabel text={label} {...labelProps} />}

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <StyledTextInput
          value={
            field.value !== undefined && field.value !== null
              ? String(field.value)
              : ""
          }
          onChangeText={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          icon={icon}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          textContentType={textContentType}
          editable={editable}
          onPress={onPress}
          error={meta.touched && meta.error ? meta.error : undefined}
          {...inputProps}
        />
      )}

      {meta.touched && meta.error ? (
        <Text style={styles.errorText}>{meta.error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 10,
  },
  errorText: {
    color: colors.error || "#FF3B30",
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 5,
    fontFamily: "Poppins-Regular",
  },
});
