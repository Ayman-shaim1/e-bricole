import React, { useState } from "react";
import { View, Text, Button, Platform, TouchableOpacity } from "react-native";
import { useField } from "formik";
import DateTimePicker from "@react-native-community/datetimepicker";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";

/**
 * A reusable form date picker component that integrates with Formik
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Field name in Formik
 * @param {string} props.label - Label text
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
  mode = "date",
  ...props
}) {
  const [field, meta, helpers] = useField(name);
  const [show, setShow] = useState(false);
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  const onChange = (event, selectedDate) => {
    setShow(Platform.OS === 'ios');
    if ((event.type === 'set' || Platform.OS === 'ios') && selectedDate) {
      // Ensure we're setting a proper Date object
      const date = new Date(selectedDate);
      helpers.setValue(date);
      helpers.setTouched(true);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Select a date";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString();
  };

  return (
    <View style={{ marginBottom: 10 }}>
      {label && <StyledLabel text={label} />}
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={{ 
          padding: 12, 
          borderWidth: 1, 
          borderColor: theme.iconColor, 
          borderRadius: 8,
          backgroundColor: theme.textInputBg 
        }}
      >
        <Text style={{ color: theme.textColor }}>{formatDate(field.value)}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={field.value ? new Date(field.value) : new Date()}
          mode={mode}
          display="default"
          onChange={onChange}
          minimumDate={new Date()} // Prevent selecting past dates
          textColor={theme.textColor}
          {...props}
        />
      )}
      {meta.touched && meta.error && (
        <Text style={{ color: colors.danger }}>{meta.error}</Text>
      )}
    </View>
  );
}
