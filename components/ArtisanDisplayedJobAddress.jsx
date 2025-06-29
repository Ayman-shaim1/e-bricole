import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { colors } from "../constants/colors";
import { getMapStyle } from "../constants/mapStyles";
import { Ionicons } from "@expo/vector-icons";
import useGeolocation from "../hooks/useGeolocation";
import { styles as mystyles } from "../constants/styles";
import { useDirections } from "../hooks/useDirections";
import StyledLabel from "./StyledLabel";
import StyledCard from "./StyledCard";
import { useTheme } from "../context/ThemeContext";

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
  const { getCurrentTheme, theme: themeName } = useTheme();
  const theme = getCurrentTheme();
  const isDark = themeName === 'dark';
  
  // Debug logging
  console.log('ArtisanDisplayedJobAddress - Theme:', themeName, 'isDark:', isDark);
  
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

  // Log map style changes
  useEffect(() => {
    console.log('Map style changed - isDark:', isDark, 'style:', getMapStyle(isDark));
  }, [isDark]);

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
            console.log("Route reçue avec", result.coordinates.length, "points");
            console.log("Premier point:", result.coordinates[0]);
            console.log("Dernier point:", result.coordinates[result.coordinates.length - 1]);
            
            // Convert coordinates from [longitude, latitude] to {latitude, longitude} format
            const formattedCoords = result.coordinates.map((coord) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
            
            console.log("Coordonnées formatées:", formattedCoords.length, "points");
            console.log("Premier point formaté:", formattedCoords[0]);
            
            setRouteCoords(formattedCoords);
            setDistance(result.formattedDistance);
          } else {
            console.log("Aucune route trouvée dans la réponse");
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

  // Calculer la région pour afficher toute la route
  const jobRegion = React.useMemo(() => {
    if (location && routeCoords.length > 0) {
      // Inclure la position actuelle, la destination et tous les points de la route
      const allCoords = [
        { latitude, longitude },
        { latitude: location.latitude, longitude: location.longitude },
        ...routeCoords,
      ];
      return getRegionForCoordinates(allCoords);
    } else if (location) {
      // Inclure seulement la position actuelle et la destination
      return getRegionForCoordinates([
        { latitude, longitude },
        { latitude: location.latitude, longitude: location.longitude },
      ]);
    } else {
      // Seulement la destination
      return {
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
  }, [latitude, longitude, location, routeCoords]);

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
          key={`map-${isDark ? 'dark' : 'light'}`}
          style={styles.miniMap}
          region={jobRegion}
          pointerEvents="none"
          scrollEnabled={false}
          mapType={isDark ? "none" : "standard"}
          customMapStyle={getMapStyle(isDark)}
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
              lineDashPattern={[]}
              lineJoin="round"
              lineCap="round"
            />
          )}
        </MapView>
      </TouchableOpacity>
      <View style={[styles.addressRow, { 
        borderColor: colors.primary,
        backgroundColor: theme.cardColor 
      }]}>
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
                  backgroundColor: theme.cardColor,
                },
              ]}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons
                name="close"
                size={28}
                color={theme.textColor}
              />
            </TouchableOpacity>
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={[
                  styles.zoomBtn,
                  {
                    backgroundColor: theme.cardColor,
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
                    backgroundColor: theme.cardColor,
                  },
                ]}
                onPress={() => handleZoom(2)}
              >
                <Ionicons name="add" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <MapView
              key={`fullmap-${isDark ? 'dark' : 'light'}`}
              ref={mapRef}
              style={styles.fullMap}
              initialRegion={modalRegion}
              region={modalRegion}
              showsUserLocation={false}
              mapType={isDark ? "none" : "standard"}
              customMapStyle={getMapStyle(isDark)}
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
                  strokeWidth={4}
                  lineDashPattern={[]}
                  lineJoin="round"
                  lineCap="round"
                />
              )}
            </MapView>
            <StyledCard style={[styles.legendContainer, { backgroundColor: theme.cardColor }]}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendMarker,
                    { backgroundColor: colors.danger },
                  ]}
                />
                <StyledLabel text="Your Position" style={[styles.legendText, { color: theme.textColor }]} />
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendMarker,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <StyledLabel text="Job Location" style={[styles.legendText, { color: theme.textColor }]} />
              </View>
            </StyledCard>
            <StyledCard style={[styles.addressOverlay, { backgroundColor: theme.cardColor }]}>
              <StyledLabel
                text={textAddress}
                style={[styles.overlayAddress, { color: theme.textColor }]}
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
                  style={[styles.overlayCoord, { color: theme.iconColor }]}
                />
                <StyledLabel
                  text={`Lng: ${longitude.toFixed(6)}`}
                  style={[styles.overlayCoord, { color: theme.iconColor }]}
                />
              </View>
            </StyledCard>
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
