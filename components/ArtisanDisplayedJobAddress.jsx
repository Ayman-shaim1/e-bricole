import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { colors } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import useGeolocation from "../hooks/useGeolocation";
import { styles as mystyles } from "../constants/styles";
import StyledText from "./StyledText";
const { width } = Dimensions.get("window");

function getRegionForCoordinates(coords) {
  // coords: [{latitude, longitude}, ...]
  let minLat, maxLat, minLng, maxLng;
  coords.forEach((coord) => {
    minLat =
      minLat === undefined ? coord.latitude : Math.min(minLat, coord.latitude);
    maxLat =
      maxLat === undefined ? coord.latitude : Math.max(maxLat, coord.latitude);
    minLng =
      minLng === undefined
        ? coord.longitude
        : Math.min(minLng, coord.longitude);
    maxLng =
      maxLng === undefined
        ? coord.longitude
        : Math.max(maxLng, coord.longitude);
  });
  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const latDelta = Math.max(0.01, (maxLat - minLat) * 1.7);
  const lngDelta = Math.max(0.01, (maxLng - minLng) * 1.7);
  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export default function ArtisanDisplayedJobAddress({
  latitude,
  longitude,
  textAddress,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const { location } = useGeolocation();
  const [zoom, setZoom] = useState(0.01);
  const mapRef = useRef(null);
  const [modalRegion, setModalRegion] = useState({
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Ajuste la région à l'ouverture du modal pour englober job + artisan
  useEffect(() => {
    if (modalVisible) {
      if (location) {
        const region = getRegionForCoordinates([
          { latitude, longitude },
          { latitude: location.latitude, longitude: location.longitude },
        ]);
        setModalRegion(region);
        setZoom(region.latitudeDelta); // synchronise le zoom pour les boutons
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion(region, 300);
          }
        }, 200);
      } else {
        setModalRegion({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setZoom(0.05);
      }
    }
  }, [modalVisible, location, latitude, longitude]);

  const jobRegion = {
    latitude: latitude,
    longitude: longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleZoom = (factor) => {
    let newZoom = zoom * factor;
    newZoom = Math.max(0.002, Math.min(newZoom, 0.2));
    setZoom(newZoom);
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: modalRegion.latitude,
          longitude: modalRegion.longitude,
          latitudeDelta: newZoom,
          longitudeDelta: newZoom,
        },
        200
      );
    }
    setModalRegion((prev) => ({
      ...prev,
      latitudeDelta: newZoom,
      longitudeDelta: newZoom,
    }));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <MapView style={styles.miniMap} region={jobRegion} pointerEvents="none">
          <Marker
            coordinate={{ latitude, longitude }}
            title="Job Location"
            pinColor={colors.primary}
          />
        </MapView>
      </TouchableOpacity>
      <View style={styles.addressRow}>
        <Ionicons name="location" size={18} color={colors.primary} />
        <StyledText text={textAddress} />
      </View>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay} activeOpacity={1}>
          <View style={styles.modalMapContainer}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
            {/* Zoom controls */}
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => handleZoom(0.5)}
              >
                <Ionicons name="remove" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => handleZoom(2)}
              >
                <Ionicons name="add" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <MapView
              ref={mapRef}
              style={styles.fullMap}
              initialRegion={modalRegion}
              region={modalRegion}
              showsUserLocation={false}
            >
              <Marker
                coordinate={{ latitude, longitude }}
                title="Job Location"
                pinColor={colors.primary}
              />
              {location && (
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Your Position"
                  pinColor={colors.secondary}
                />
              )}
            </MapView>
            {/* Overlay address and coordinates */}
            <View style={styles.addressOverlay}>
              <StyledText text={textAddress} style={styles.overlayAddress} numberOfLines={2} />
              <View style={styles.overlayCoordsRow}>
                <StyledText text={`Lat: ${latitude.toFixed(6)}`} style={styles.overlayCoord} />
                <StyledText text={`Lng: ${longitude.toFixed(6)}`} style={styles.overlayCoord} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  miniMap: {
    width: width - 48,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight3,
    paddingVertical: mystyles.paddingVertical,
    paddingHorizontal: 5,
    borderRadius: mystyles.borderRadius,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalMapContainer: {
    width: width * 0.95,
    height: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 2,
    elevation: 2,
  },
  zoomControls: {
    position: "absolute",
    bottom: 60,
    right: 12,
    zIndex: 10,
    flexDirection: "column",
    gap: 8,
  },
  zoomBtn: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  fullMap: {
    width: "100%",
    height: "100%",
  },
  addressOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    zIndex: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  overlayAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  overlayCoordsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  overlayCoord: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
