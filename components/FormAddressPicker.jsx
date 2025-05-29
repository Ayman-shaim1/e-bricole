import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useField } from "formik";
import StyledAddressPicker from "./StyledAddressPicker";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";

/**
 * A reusable form address picker component that integrates with Formik
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Field name in Formik
 * @param {string} props.label - Label text for the field
 * @param {boolean} props.editable - Whether the address picker is editable
 * @param {boolean} props.useLabel - Whether to use label or input display
 * @param {Object} props.coordinates - Current coordinates {latitude, longitude}
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onPick - Callback when an address is picked
 * @param {Object} props.labelProps - Additional props for the label
 * @param {Object} props.addressPickerProps - Additional props for the address picker
 */
export default function FormAddressPicker({
  name,
  label,
  editable = false,
  useLabel = true,
  isLoading,
  onPick,
  labelProps = {},
  addressPickerProps = {},
}) {
  // Use Formik's useField hook to connect to form state
  const [field, meta, helpers] = useField(name);

  // Handle address change
  const handleAddressChange = (address) => {
    helpers.setValue(address);
    helpers.setTouched(true);
  };

  // Handle address pick from the picker
  const handleAddressPick = (selectedAddress) => {
    helpers.setValue(selectedAddress);
    helpers.setTouched(true);

    // Call the external onPick callback if provided
    if (onPick) {
      onPick(selectedAddress);
    }
  };

  return (
    <View style={[styles.container]}>
      {label && <StyledLabel text={label} {...labelProps} />}

      <StyledAddressPicker
        value={field.value}
        onChangeText={handleAddressChange}
        editable={editable}
        useLabel={useLabel}
        coordinates={field.value?.coordinates}
        error={meta.touched && meta.error ? meta.error : null}
        isLoading={isLoading}
        onPick={handleAddressPick}
        {...addressPickerProps}
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