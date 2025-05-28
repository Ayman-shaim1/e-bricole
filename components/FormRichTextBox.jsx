import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useField } from "formik";
import StyledRichTextBox from "./StyledRichTextBox";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";

/**
 * A reusable form rich text box component that integrates with Formik
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Field name in Formik
 * @param {string} props.label - Label text
 * @param {Object} props.icon - Icon source
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.editable - Whether the input is editable
 * @param {Function} props.onPress - Function to call on press
 * @param {number} props.minHeight - Minimum height of the text box
 * @param {number} props.maxLength - Maximum character length
 * @param {number} props.numberOfLines - Initial number of lines
 * @param {string} props.width - Width of the component
 * @param {Object} props.labelProps - Additional props for the label
 * @param {Object} props.inputProps - Additional props for the input
 */
export default function FormRichTextBox({
  name,
  label,
  icon,
  placeholder,
  editable,
  onPress,
  minHeight,
  maxLength,
  numberOfLines,
  width,
  labelProps = {},
  inputProps = {},
}) {
  // Use Formik's useField hook to connect to form state
  const [field, meta, helpers] = useField(name);

  return (
    <View style={[styles.container]}>
      {label && <StyledLabel text={label} {...labelProps} />}

      <StyledRichTextBox
        value={field.value}
        onChangeText={(text) => {
          helpers.setValue(text);
          // Mark as touched on change to show validation immediately
          helpers.setTouched(true);
        }}
        placeholder={placeholder}
        icon={icon}
        editable={editable}
        onPress={onPress}
        minHeight={minHeight}
        maxLength={maxLength}
        numberOfLines={numberOfLines}
        width={width}
        onBlur={() => helpers.setTouched(true)}
        {...inputProps}
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
    marginTop: -5,
    marginBottom: 5,
    paddingHorizontal: 5,
    fontFamily: "Poppins-Regular",
  },
}); 