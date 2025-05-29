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
 * @param {string} props.label - Label text
 * @param {boolean} props.useLabel - Whether to use label mode vs text input mode
 * @param {boolean} props.editable - Whether the input is editable
 * @param {string} props.width - Width of the component (default: "100%")
 * @param {Object} props.style - Custom style for the address picker
 * @param {Object} props.labelProps - Additional props for the label
 * @param {Object} props.addressPickerProps - Additional props for the address picker
 * @param {Object} props.containerStyle - Additional styles for the container
 */
export default function FormStyledAddressPicker({
  name,
  label,
  useLabel = false,
  editable = false,
  width = "100%",
  style,
  labelProps = {},
  addressPickerProps = {},
  containerStyle = {},
}) {
  // Use Formik's useField hook to connect to form state
  const [field, meta, helpers] = useField(name);

  // Handle address picking
  const handleAddressPick = (coordinates) => {
    // Store both coordinates and any additional data
    const addressData = {
      coordinates,
      timestamp: Date.now(), // For tracking when address was selected
    };

    helpers.setValue(addressData);
    helpers.setTouched(true);
  };

  // Extract specific props from addressPickerProps
  const {
    coordinates: defaultCoordinates,
    error: geolocationError,
    isLoading: geolocationLoading,
    ...otherAddressPickerProps
  } = addressPickerProps;

  // Use coordinates from field value (user selected) or default coordinates (geolocation)
  const coordinates = field.value?.coordinates || defaultCoordinates;

  return (
    <View style={[styles.container, { width }, containerStyle]}>
      {label && <StyledLabel text={label} {...labelProps} />}
      <StyledAddressPicker
        value={field.value?.formattedAddress || ""} // Display formatted address if available
        coordinates={coordinates}
        onPick={handleAddressPick}
        useLabel={useLabel}
        editable={editable}
        style={style}
        error={geolocationError}
        isLoading={geolocationLoading}
        {...otherAddressPickerProps}
      />

      {meta.touched && meta.error ? (
        <Text style={styles.errorText}>{meta.error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // width controlled by width prop
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
