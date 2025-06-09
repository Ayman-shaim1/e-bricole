import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Platform,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import GoBackButton from "../../components/GoBackButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import StyledButton from "../../components/StyledButton";
import StyledTextInput from "../../components/StyledTextInput";
import useReverseGeocode from "../../hooks/useReverseGeocode";
import useAddressSearch from "../../hooks/useAddressSearch";
import StyledCard from "../../components/StyledCard";
import StyledLabel from "../../components/StyledLabel";
import { useTheme } from "../../context/ThemeContext";

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
  const mapRef = useRef(null);
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  const { latitude, longitude, callbackId } = params;
  const initialCoordinates = {
    latitude: latitude ? parseFloat(latitude) : 37.78825,
    longitude: longitude ? parseFloat(longitude) : -122.4324,
  };

  const [selectedLocation, setSelectedLocation] = useState(initialCoordinates);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressData, setAddressData] = useState(null);
  const [currentRegion, setCurrentRegion] = useState({
    latitude: initialCoordinates.latitude,
    longitude: initialCoordinates.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const {
    data,
    loading: rvloading,
    error: rvError,
    reverseGeocode,
  } = useReverseGeocode();

  const {
    suggestions,
    loading: searchLoading,
    error: searchError,
    searchAddresses,
    clearSuggestions,
  } = useAddressSearch();

  const formatAddress = () => {
    if (!addressData || !addressData.address) return "";
    const { road, city, country, house_number } = addressData.address;
    let formatted = "";
    if (house_number) formatted += house_number + " ";
    if (road) formatted += road;
    if (city) formatted += (formatted ? ", " : "") + city;
    if (country) formatted += (formatted ? ", " : "") + country;
    return formatted || "Adresse non trouvée";
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setShowSuggestions(false);
  };

  const handleLocationConfirm = () => {
    if (callbackId && callbackRegistry.has(callbackId)) {
      const callback = callbackRegistry.get(callbackId);
      const addressObject = {
        coordinates: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        },
        address: formatAddress(),
        timestamp: Date.now(),
      };
      callback(addressObject);
      unregisterCallback(callbackId);
    }
    router.back();
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.trim().length >= 3) {
      setShowSuggestions(true);
      searchAddresses(text);
    } else {
      setShowSuggestions(false);
      clearSuggestions();
    }
  };

  const handleSuggestionPress = (suggestion) => {
    const newLocation = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    };
    setSelectedLocation(newLocation);
    setSearchQuery(suggestion.formattedAddress);
    setShowSuggestions(false);
    clearSuggestions();
    setAddressData(null);
    mapRef.current?.animateToRegion(
      {
        ...newLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) setShowSuggestions(true);
  };
  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      style={getStyles(theme).suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Text style={getStyles(theme).suggestionText} numberOfLines={2}>
        {item.formattedAddress}
      </Text>
    </TouchableOpacity>
  );

  const handleCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Permission d'accès à la localisation refusée"
        );
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSelectedLocation(newLocation);
      setSearchQuery("");
      mapRef.current?.animateToRegion(
        { ...newLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        1000
      );
    } catch {
      Alert.alert("Erreur", "Impossible d'obtenir la position actuelle");
    }
  };

  const handleZoomIn = () => {
    const newRegion = {
      ...currentRegion,
      latitudeDelta: currentRegion.latitudeDelta * 0.5,
      longitudeDelta: currentRegion.longitudeDelta * 0.5,
    };
    setCurrentRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  const handleZoomOut = () => {
    const newRegion = {
      ...currentRegion,
      latitudeDelta: currentRegion.latitudeDelta * 2,
      longitudeDelta: currentRegion.longitudeDelta * 2,
    };
    setCurrentRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  const handleRegionChange = (region) => setCurrentRegion(region);

  useEffect(() => {
    (async () => {
      const result = await reverseGeocode(
        selectedLocation.latitude,
        selectedLocation.longitude
      );
      result && setAddressData(result);
    })();
  }, [selectedLocation]);

  useEffect(() => {
    if (addressData && !searchQuery) setSearchQuery(formatAddress());
  }, [addressData]);

  return (
    <View style={getStyles(theme).container}>
      {/* Header + barre de recherche */}
      <View style={getStyles(theme).header}>
        <GoBackButton />
        <View style={getStyles(theme).searchContainer}>
          <StyledTextInput
            placeholder="Rechercher une adresse..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            width="99%"
          />
          {searchLoading && (
            <ActivityIndicator
              size="small"
              style={getStyles(theme).searchLoader}
            />
          )}
        </View>
      </View>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={getStyles(theme).suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id.toString()}
            style={getStyles(theme).suggestionsList}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews
          />
        </View>
      )}

      {/* Carte */}
      <MapView
        ref={mapRef}
        style={getStyles(theme).map}
        initialRegion={{
          latitude: initialCoordinates.latitude,
          longitude: initialCoordinates.longitude,
          latitudeDelta: 0.0025,
          longitudeDelta: 0.0025,
        }}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={selectedLocation}
          title="Selected Location"
          description={searchQuery || formatAddress()}
          pinColor="red"
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedLocation({ latitude, longitude });
            setSearchQuery("");
          }}
        />
      </MapView>

      {/* → Bouton de confirmation en overlay ← */}
      <View style={getStyles(theme).btnContainer}>
        <StyledButton onPress={handleLocationConfirm} text="confirm" />
      </View>

      {/* Affichage de l'adresse sélectionnée */}
      <StyledCard style={getStyles(theme).addressDisplayZone}>
        <StyledLabel
          text="📍 Adresse sélectionnée :"
          style={getStyles(theme).addressLabel}
        />
        <StyledLabel
          text={
            rvloading
              ? "Recherche de l'adresse en cours..."
              : formatAddress() || "Adresse non trouvée"
          }
          style={getStyles(theme).addressText}
          numberOfLines={3}
        />
        <View style={getStyles(theme).coordinatesDisplay}>
          <StyledLabel
            text={`Lat: ${selectedLocation.latitude.toFixed(6)}`}
            style={getStyles(theme).coordinateText}
          />
          <StyledLabel
            text={`Lng: ${selectedLocation.longitude.toFixed(6)}`}
            style={getStyles(theme).coordinateText}
          />
        </View>
      </StyledCard>

      {/* Contrôles zoom / localisation */}
      <View style={getStyles(theme).mapControls}>
        <TouchableOpacity
          style={getStyles(theme).controlButton}
          onPress={handleCurrentLocation}
        >
          <Ionicons name="locate" size={24} color={theme.iconColorFocused} />
        </TouchableOpacity>
        <TouchableOpacity
          style={getStyles(theme).controlButton}
          onPress={handleZoomIn}
        >
          <Ionicons name="add" size={24} color={theme.iconColorFocused} />
        </TouchableOpacity>
        <TouchableOpacity
          style={getStyles(theme).controlButton}
          onPress={handleZoomOut}
        >
          <Ionicons name="remove" size={24} color={theme.iconColorFocused} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
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
    searchContainer: {
      flex: 1,
      position: "relative",
      zIndex: 999,
    },
    searchLoader: {
      position: "absolute",
      right: 15,
      top: "50%",
      transform: [{ translateY: -10 }],
    },
    suggestionsContainer: {
      position: "absolute",
      top: Platform.OS === "ios" ? 120 : 80,
      left: 16,
      right: 16,
      backgroundColor: theme.cardColor,
      borderWidth: 1,
      borderColor: theme.iconColor + "40",
      borderRadius: 8,
      marginTop: 5,
      maxHeight: 200,
      zIndex: 1002,
    },
    suggestionsList: {
      maxHeight: 200,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.iconColor + "20",
    },
    suggestionText: {
      fontSize: 14,
      color: theme.textColor,
      lineHeight: 18,
    },
    map: {
      flex: 1,
    },
    btnContainer: {
      position: "absolute",
      bottom: "7%",
      width: "100%",
      paddingHorizontal: 16,
      zIndex: 1001,
    },
    addressDisplayZone: {
      position: "absolute",
      top: "14%",
      left: 16,
      right: 16,
      backgroundColor: theme.cardColor,
      borderRadius: 12,
      padding: 16,

      borderWidth: 1,
      borderColor: theme.iconColor + "40",
      zIndex: 500,
    },
    addressLabel: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.textColor,
      marginBottom: 8,
    },
    addressText: {
      fontSize: 14,
      color: theme.textColor,
      lineHeight: 20,
      marginBottom: 8,
    },
    coordinatesDisplay: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.iconColor + "20",
    },
    coordinateText: {
      fontSize: 12,
      color: theme.iconColor,
      fontWeight: "500",
    },
    mapControls: {
      position: "absolute",
      bottom: "18%",
      right: 16,
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      zIndex: 1000,
    },
    controlButton: {
      backgroundColor: theme.cardColor,
      borderRadius: 25,
      width: 50,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.iconColor + "40",
    },
  });
