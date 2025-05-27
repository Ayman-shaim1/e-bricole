import { useState, useCallback } from 'react';

/**
 * Hook pour récupérer l'adresse à partir des coordonnées GPS en utilisant l'API Nominatim
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
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "e-bricole-app/1.0 (contact@votredomaine.com)",
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur de l'API Nominatim:", response.status, errorText);
        throw new Error(
          `Erreur ${response.status} lors de la récupération de l'adresse`
        );
      }

      const result = await response.json();
      setData(result);
      return result;
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
