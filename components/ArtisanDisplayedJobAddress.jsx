import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  useColorScheme,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { colors } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import useGeolocation from "../hooks/useGeolocation";
import { styles as mystyles } from "../constants/styles";
import { useDirections } from "../hooks/useDirections";
import StyledLabel from "./StyledLabel";
import StyledCard from "./StyledCard";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [routeCoords, setRouteCoords] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const { location } = useGeolocation();
  const [zoom, setZoom] = useState(0.01);
  const mapRef = useRef(null);
  const { getDirections, loading: directionsLoading } = useDirections();
  const [distance, setDistance] = useState(null);
  const [modalRegion, setModalRegion] = useState({
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Fetch route when location is available
  useEffect(() => {
    const fetchRoute = async () => {
      if (location) {
        try {
          const result = await getDirections(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude, longitude }
          );
          if (result && result.coordinates) {
            // Convert coordinates from [longitude, latitude] to {latitude, longitude} format
            const formattedCoords = result.coordinates.map((coord) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
            setRouteCoords(formattedCoords);
            setDistance(result.formattedDistance);
          }
        } catch (error) {
          console.error("Error fetching route:", error);
        }
      }
    };

    fetchRoute();
  }, [location, latitude, longitude]);

  // Update map region when modal opens
  useEffect(() => {
    if (modalVisible) {
      if (location) {
        const region = getRegionForCoordinates([
          { latitude, longitude },
          { latitude: location.latitude, longitude: location.longitude },
          ...routeCoords,
        ]);
        setModalRegion(region);
        setZoom(region.latitudeDelta);
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
  }, [modalVisible, location, latitude, longitude, routeCoords]);

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
        <MapView
          style={styles.miniMap}
          region={jobRegion}
          pointerEvents="none"
          scrollEnabled={false}
          customMapStyle={isDark ? darkMapStyle : []}
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title="Job Location"
            pinColor={colors.primary}
          />
        </MapView>
      </TouchableOpacity>
      <View style={styles.addressRow}>
        <Ionicons name="location" size={18} color={colors.primary} />
        <StyledLabel text={textAddress} />
        {distance && (
          <View style={styles.distanceContainer}>
            <Ionicons name="navigate" size={16} color={colors.primary} />
            <StyledLabel text={distance} style={styles.distanceText} />
          </View>
        )}
      </View>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)" },
          ]}
        >
          <View style={styles.modalMapContainer}>
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? colors.dark.cardColor
                    : colors.white,
                },
              ]}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons
                name="close"
                size={28}
                color={isDark ? colors.dark.textColor : colors.light.textColor}
              />
            </TouchableOpacity>
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={[
                  styles.zoomBtn,
                  {
                    backgroundColor: isDark
                      ? colors.dark.cardColor
                      : colors.white,
                  },
                ]}
                onPress={() => handleZoom(0.5)}
              >
                <Ionicons name="remove" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.zoomBtn,
                  {
                    backgroundColor: isDark
                      ? colors.dark.cardColor
                      : colors.white,
                  },
                ]}
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
              customMapStyle={isDark ? darkMapStyle : []}
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
                  pinColor={colors.danger}
                />
              )}

              {routeCoords.length > 0 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor={colors.primary}
                  strokeWidth={3}
                />
              )}
            </MapView>
            <StyledCard style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendMarker,
                    { backgroundColor: colors.danger },
                  ]}
                />
                <StyledLabel text="Your Position" style={styles.legendText} />
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendMarker,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <StyledLabel text="Job Location" style={styles.legendText} />
              </View>
            </StyledCard>
            <StyledCard style={styles.addressOverlay}>
              <StyledLabel
                text={textAddress}
                style={styles.overlayAddress}
                numberOfLines={2}
              />
              {distance && (
                <View style={styles.overlayDistanceRow}>
                  <Ionicons name="navigate" size={16} color={colors.primary} />
                  <StyledLabel text={distance} style={styles.overlayDistance} />
                </View>
              )}
              <View style={styles.overlayCoordsRow}>
                <StyledLabel
                  text={`Lat: ${latitude.toFixed(6)}`}
                  style={styles.overlayCoord}
                />
                <StyledLabel
                  text={`Lng: ${longitude.toFixed(6)}`}
                  style={styles.overlayCoord}
                />
              </View>
            </StyledCard>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#242f3e" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#242f3e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
];

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
  addressCard: {
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: mystyles.paddingVertical - 5,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderRadius: mystyles.borderRadius,
    borderColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalMapContainer: {
    width: width * 0.95,
    height: "80%",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
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
    top: 55,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 12,
    zIndex: 20,
  },
  overlayAddress: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  overlayCoordsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  overlayCoord: {
    fontSize: 13,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  overlayDistanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  overlayDistance: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  legendContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
});
