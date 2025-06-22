import { useState, useCallback } from 'react';
import settings from '../config/settings';

/**
 * Hook pour récupérer l'adresse à partir des coordonnées GPS en utilisant Nominatim
 * @returns {Object} { data, loading, error, reverseGeocode }
 */
const useReverseGeocode = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reverseGeocode = useCallback(async (lat, lon, retryCount = 0) => {
    if (!lat || !lon) {
      setError(new Error('Latitude et longitude sont requises'));
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Utiliser directement Nominatim au lieu d'OpenRouteService
      const fallbackUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
      
      // Utiliser AbortController pour le timeout
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 10000);
      
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'E-Bricole-App/1.0',
        },
        signal: fallbackController.signal,
      });
      
      clearTimeout(fallbackTimeoutId);
      
      if (fallbackResponse.ok) {
        const fallbackResult = await fallbackResponse.json();
        const formattedData = {
          display_name: fallbackResult.display_name,
          address: {
            road: fallbackResult.address?.road,
            city: fallbackResult.address?.city || fallbackResult.address?.town,
            country: fallbackResult.address?.country,
            house_number: fallbackResult.address?.house_number,
            postcode: fallbackResult.address?.postcode,
          },
          lat: parseFloat(fallbackResult.lat),
          lon: parseFloat(fallbackResult.lon),
        };
        
        setData(formattedData);
        return formattedData;
      } else {
        throw new Error(`Erreur ${fallbackResponse.status} lors de la récupération de l'adresse`);
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
