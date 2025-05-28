import { useState, useCallback } from 'react';
import settings from '../config/settings';

/**
 * Hook pour récupérer l'adresse à partir des coordonnées GPS en utilisant l'API OpenRouteService
 * @returns {Object} { data, loading, error, reverseGeocode }
 */
const useReverseGeocode = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reverseGeocode = useCallback(async (lat, lon) => {
    if (!lat || !lon) {
      setError(new Error('Latitude et longitude sont requises'));
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `https://api.openrouteservice.org/geocode/reverse?api_key=${settings.openRouteApiKey}&point.lon=${lon}&point.lat=${lat}&size=1`;

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur de l'API OpenRouteService:", response.status, errorText);
        throw new Error(
          `Erreur ${response.status} lors de la récupération de l'adresse`
        );
      }

      const result = await response.json();
      
      if (result.features && result.features.length > 0) {
        const feature = result.features[0];
        const formattedData = {
          display_name: feature.properties.label,
          address: {
            road: feature.properties.street || feature.properties.name,
            city: feature.properties.locality || feature.properties.localadmin,
            country: feature.properties.country,
            house_number: feature.properties.housenumber,
            postcode: feature.properties.postalcode,
          },
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        };
        
        setData(formattedData);
        return formattedData;
      } else {
        setData(null);
        return null;
      }
    } catch (err) {
      console.error("Erreur de géocodage inverse:", err.message);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    reverseGeocode,
  };
};

export default useReverseGeocode;
