import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";

/**
 * Hook personnalisé pour obtenir la position géographique actuelle de l'appareil
 * @returns {Object} Un objet contenant :
 * - location: La position actuelle (null si non disponible)
 * - address: Toutes les données d'adresse de l'API Nominatim ou null si non disponible
 * - error: Un message d'erreur s'il y en a un (null sinon)
 * - isLoading: Un booléen indiquant si la position est en cours de chargement
 */
export default function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      try {
        // Vérifier les autorisations
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          if (isMounted) {
            setError("La permission d'accès à la localisation a été refusée");
            setIsLoading(false);
          }
          return;
        }

        // Obtenir la position actuelle
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) return;

        const { latitude, longitude } = currentLocation.coords;

        // Mettre à jour l'emplacement
        const locationData = {
          latitude,
          longitude,
          altitude: currentLocation.coords.altitude,
          accuracy: currentLocation.coords.accuracy,
          altitudeAccuracy: currentLocation.coords.altitudeAccuracy,
          heading: currentLocation.coords.heading,
          speed: currentLocation.coords.speed,
        };
        setLocation(locationData);

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    getLocation();

    // Nettoyage lors du démontage du composant
    return () => {
      isMounted = false;
    };
  }, []);

  return { location, address, error, isLoading };
}
