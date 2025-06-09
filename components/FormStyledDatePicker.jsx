import React, { useState } from "react";
import { View, Text, Button, Platform, TouchableOpacity } from "react-native";
import { useField } from "formik";
import DateTimePicker from "@react-native-community/datetimepicker";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";

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

  const onChange = (event, selectedDate) => {
    setShow(false);
    if ((event.type === 'set' || Platform.OS === 'ios') && selectedDate) {
      helpers.setValue(selectedDate);
      helpers.setTouched(true);
    }
  };

  return (
    <View style={{ marginBottom: 10 }}>
      {label && <StyledLabel text={label} />}
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={{ padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 ,backgroundColor:colors.white}}
      >
        <Text>
          {field.value
            ? (field.value instanceof Date ? field.value.toLocaleDateString() : new Date(field.value).toLocaleDateString())
            : "Select a date"}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={field.value || new Date()}
          mode={mode}
          display="default"
          onChange={onChange}
        />
      )}
      {meta.touched && meta.error && (
        <Text style={{ color: "red" }}>{meta.error}</Text>
      )}
    </View>
  );
}
