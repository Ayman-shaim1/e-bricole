import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

/**
 * Récupère l'adresse à partir des coordonnées GPS en utilisant l'API Nominatim
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Les données d'adresse
 */
const reverseGeocode = async (lat, lon) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'e-bricole-app/1.0 (contact@votredomaine.com)',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur de l\'API Nominatim:', response.status, errorText);
      throw new Error(`Erreur ${response.status} lors de la récupération de l'adresse`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur de géocodage inverse:', error.message);
    throw error;
  }
};

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

    const getLocationAndAddress = async () => {
      try {
        // Vérifier les autorisations
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          if (isMounted) {
            setError('La permission d\'accès à la localisation a été refusée');
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
        
        // Récupérer l'adresse
        try {
          const addressData = await reverseGeocode(latitude, longitude);
          if (isMounted) {
            setAddress(addressData);
          }
        } catch (err) {
          console.warn('Impossible de récupérer l\'adresse:', err.message);
          if (isMounted) {
            setError(`Erreur: ${err.message}`);
          }
        }
        
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

    getLocationAndAddress();

    // Nettoyage lors du démontage du composant
    return () => {
      isMounted = false;
    };
  }, []);

  return { location, address, error, isLoading };
}
