import React, { useEffect, useState } from "react";
import { StyleSheet, View, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import GoBackButton from "../../components/GoBackButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import StyledButton from "../../components/StyledButton";
import StyledTextInput from "../../components/StyledTextInput";
import useReverseGeocode from "../../hooks/useReverseGeocode";

const callbackRegistry = new Map();

export const registerCallback = (id, callback) => {
  callbackRegistry.set(id, callback);
};

export const unregisterCallback = (id) => {
  callbackRegistry.delete(id);
};

export default function AddressPickerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Get params from navigation
  const { latitude, longitude, callbackId } = params;

  // Use passed coordinates or default coordinates
  const initialCoordinates = {
    latitude: latitude ? parseFloat(latitude) : 37.78825,
    longitude: longitude ? parseFloat(longitude) : -122.4324,
  };

  const [selectedLocation, setSelectedLocation] = useState(initialCoordinates);
  const {
    data,
    loading: rvloading,
    error: rvError,
    reverseGeocode,
  } = useReverseGeocode();

  const formatAddress = () => {
    if (!data) return "";
    const { road, city, country } = data.address;
    return `${road}, ${city}, ${country}`;
  };
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleLocationConfirm = () => {
    if (callbackId && callbackRegistry.has(callbackId)) {
      const callback = callbackRegistry.get(callbackId);
      callback(selectedLocation);
      unregisterCallback(callbackId);
    }
    router.back();
  };

  useEffect(() => {
    const getAddress = async () => {
      if (selectedLocation)
        await reverseGeocode(
          selectedLocation.latitude,
          selectedLocation.longitude
        );
    };
    getAddress();
  }, [selectedLocation]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GoBackButton />
        <StyledTextInput
          placeholder={"search for address"}
          value={formatAddress()}
          width={"94%"}
        />
      </View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: initialCoordinates.latitude,
          longitude: initialCoordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Marker
          coordinate={selectedLocation}
          title="Selected Location"
          description={formatAddress()}
          pinColor="red"
          draggable={true}
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedLocation({ latitude, longitude });
          }}
        />
        <View style={styles.btnContainer}>
          <StyledButton onPress={handleLocationConfirm} text={"confirm"} />
        </View>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  map: {
    flex: 1,
  },
  btnContainer: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    padding: 10,
  },
});
