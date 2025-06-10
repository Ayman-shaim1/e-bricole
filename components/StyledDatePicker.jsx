import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import StyledLabel from "./StyledLabel";

export default function StyledDatePicker({
  label,
  value,
  onChange,
  mode = "date",
  placeholder = "Select date/time",
  ...props
}) {
  const [show, setShow] = useState(false);

  const handleChange = (event, selectedDate) => {
    setShow(false);
    if ((event.type === 'set' || Platform.OS === 'ios') && selectedDate) {
      onChange && onChange(selectedDate);
    }
  };

  return (
    <View style={{ marginBottom: 10 }}>
      {label && <StyledLabel text={label} />}
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={{
          padding: 12,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          marginBottom:10
        }}
      >
        <StyledLabel
          text={
            value
              ? value instanceof Date
                ? value.toLocaleDateString()
                : new Date(value).toLocaleDateString()
              : placeholder
          }
          style={{ backgroundColor: "red" }}
        />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}

