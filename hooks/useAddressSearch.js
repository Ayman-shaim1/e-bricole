import { useState, useCallback } from "react";
import settings from "../config/settings";

/**
 * Hook pour rechercher des adresses avec autocomplétion en utilisant Nominatim
 * @returns {Object} { suggestions, loading, error, searchAddresses, clearSuggestions }
 */
const useAddressSearch = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const searchAddresses = useCallback(async (query, retryCount = 0) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Utiliser directement Nominatim au lieu d'OpenRouteService
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      
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
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData && fallbackData.length > 0) {
          const formattedSuggestions = fallbackData.map((item) => ({
            id: item.place_id?.toString() || Math.random().toString(),
            displayName: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            formattedAddress: item.display_name,
            description: item.display_name,
            country: item.address?.country,
            region: item.address?.state,
            locality: item.address?.city || item.address?.town,
          }));
          
          setSuggestions(formattedSuggestions);
          return formattedSuggestions;
        } else {
          setSuggestions([]);
          return [];
        }
      } else {
        throw new Error(`Erreur ${fallbackResponse.status} lors de la recherche d'adresses`);
      }
    } catch (err) {
      console.error("Erreur de recherche d'adresses:", err.message);
      setError(err);
      setSuggestions([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    loading,
    error,
    searchAddresses,
    clearSuggestions,
  };
};

export default useAddressSearch;
