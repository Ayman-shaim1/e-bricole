import React, { useEffect } from "react";
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
}) {
  const router = useRouter();

  const { data, loading, error: rvError, reverseGeocode } = useReverseGeocode();

  // Format the address string
  const formatAddress = () => {
    if (!data) return "";
    const { road, city, country } = data.address;
    return `${road}, ${city}, ${country}`;
  };

  // Use value prop or geolocation address
  const displayAddress = value || formatAddress();
  const addressText = useSplit(displayAddress, 34);

  // Handle navigation to address picker screen
  const handleAddressPickerPress = () => {
    if (onPick) {
      // Generate a unique callback ID
      const callbackId = `callback_${Date.now()}_${Math.random()}`;

      // Register the callback
      registerCallback(callbackId, onPick);

      router.push({
        pathname: "/shared/address-picker",
        params: {
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
          callbackId: callbackId,
        },
      });
    } else {
      router.push({
        pathname: "/shared/address-picker",
        params: {
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
        },
      });
    }
  };

  useEffect(() => {
    const getAddress = async () => {
      if (coordinates)
        await reverseGeocode(coordinates.latitude, coordinates.longitude);
    };

    getAddress();
  }, [coordinates]);

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
            <StyledLabel text={error} color="danger" style={styles.errorText} />
          )}
          {rvError && (
            <StyledLabel
              text={rvError}
              color="danger"
              style={styles.errorText}
            />
          )}
        </>
      ) : (
        <>
          {useLabel ? (
            <StyledLabel text={addressText} style={styles.label} />
          ) : (
            <StyledTextInput
              value={addressText}
              onChangeText={onChangeText}
              placeholder={
                isLoading ? "Loading location..." : "Current address"
              }
              icon={MAP_MARKER}
              editable={editable}
              onPress={handleAddressPickerPress}
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
