import React, { useEffect, useMemo } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import StyledTextInput from "./StyledTextInput";
import StyledLabel from "./StyledLabel";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../constants/colors";
import useSplit from "../hooks/useSplit";
import { useRouter } from "expo-router";
import useReverseGeocode from "../hooks/useReverseGeocode";
import { registerCallback } from "../app/shared/address-picker";

const MAP_MARKER = require("../assets/icons/map-maker.png");

export default function StyledAddressPicker({
  value,
  onChangeText,
  editable = false,
  style,
  useLabel = true,
  coordinates,
  error,
  isLoading,
  onPick,
  shouldPick = true,
}) {
  const router = useRouter();
  const { data, loading, error: rvError, reverseGeocode } = useReverseGeocode();

  // Format the address string - memoized to recalculate when data changes
  const formatAddress = useMemo(() => {
    if (!data || !data.address) return "";
    const { road, city, country } = data.address;

    // Build address parts array and filter out empty/undefined values
    const addressParts = [road, city, country].filter(
      (part) => part && part.trim()
    );

    if (addressParts.length === 0) return "";

    // Join with commas and proper spacing
    return addressParts.join(", ");
  }, [data]);

  // Use value prop or geolocation address - recalculates when formatAddress changes
  const displayAddress = useMemo(() => {
    if (value && typeof value === "string") {
      return value;
    }
    if (value && value.address) {
      return value.address;
    }
    return formatAddress;
  }, [value, formatAddress]);

  // Extract coordinates from value prop if available
  const currentCoordinates = useMemo(() => {
    return value && value.coordinates ? value.coordinates : coordinates;
  }, [value, coordinates]);

  const addressText = useSplit(displayAddress, 30);

  // Handle navigation to address picker screen
  const handleAddressPickerPress = () => {
    if (onPick) {
      // Generate a unique callback ID
      const callbackId = `callback_${Date.now()}_${Math.random()}`;

      // Register the callback
      registerCallback(callbackId, onPick);
      if (shouldPick) {
        router.push({
          pathname: "/shared/address-picker",
          params: {
            latitude: currentCoordinates?.latitude,
            longitude: currentCoordinates?.longitude,
            callbackId: callbackId,
          },
        });
      }
    } else {
      if (shouldPick) {
        router.push({
          pathname: "/shared/address-picker",
          params: {
            latitude: currentCoordinates?.latitude,
            longitude: currentCoordinates?.longitude,
          },
        });
      }
    }
  };

  useEffect(() => {
    const getAddress = async () => {
      if (currentCoordinates && !value?.address) {
        await reverseGeocode(
          currentCoordinates.latitude,
          currentCoordinates.longitude
        );
      }
    };

    getAddress();
  }, [currentCoordinates, value]);

  // Helper function to get error message from error object or string
  const getErrorMessage = (err) => {
    if (!err) return "";
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message;
    if (typeof err === "object" && err.error) return err.error;
    return "An error occurred";
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handleAddressPickerPress}
    >
      {useLabel && (
        <Ionicons
          name="location-sharp"
          size={18}
          color={colors.primary}
          style={styles.locationIcon}
        />
      )}
      {rvError || error ? (
        <>
          {error && (
            <StyledLabel
              text={getErrorMessage(error)}
              color="danger"
              style={styles.errorText}
            />
          )}
          {rvError && (
            <StyledLabel
              text={getErrorMessage(rvError)}
              color="danger"
              style={styles.errorText}
            />
          )}
        </>
      ) : (
        <>
          {useLabel ? (
            <StyledLabel text={addressText || ""} style={styles.label} />
          ) : (
            <StyledTextInput
              value={addressText || ""}
              onChangeText={onChangeText}
              placeholder={
                isLoading
                  ? "Loading location..."
                  : "e.g xx street, zz city, oo country"
              }
              icon={MAP_MARKER}
              editable={editable}
              onPress={handleAddressPickerPress}
              style={styles.inputText}
            />
          )}
        </>
      )}

      {(isLoading || loading) && useLabel && (
        <StyledLabel
          text="Loading location..."
          color="darkGray"
          style={styles.loadingText}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 9999,
  },
  inputText: {
    zIndex: 10,
  },
  label: {
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 4,
    marginBottom: 5,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
  },
  loadingText: {
    fontSize: 12,
  },
});
