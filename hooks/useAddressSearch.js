import { useState, useCallback } from "react";
import settings from "../config/settings";

/**
 * Hook pour rechercher des adresses avec autocomplétion en utilisant l'API OpenRouteService
 * @returns {Object} { suggestions, loading, error, searchAddresses, clearSuggestions }
 */
const useAddressSearch = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const searchAddresses = useCallback(async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Utilisation de l'API OpenRouteService Geocoding
      const apiUrl = `https://api.openrouteservice.org/geocode/search?api_key=${
        settings.openRouteApiKey
      }&text=${encodeURIComponent(query)}&size=5&layers=address,venue`;

      const response = await fetch(apiUrl, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Erreur de l'API OpenRouteService:",
          response.status,
          errorText
        );
        throw new Error(
          `Erreur ${response.status} lors de la recherche d'adresses`
        );
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        setSuggestions([]);
        return [];
      }

      // Formater les résultats pour l'affichage
      const formattedSuggestions = data.features.map((feature) => ({
        id: feature.properties?.id || Math.random().toString(),
        displayName: feature.properties?.label || feature.properties?.name,
        latitude: feature.geometry.coordinates[1], // OpenRouteService retourne [longitude, latitude]
        longitude: feature.geometry.coordinates[0],
        formattedAddress: feature.properties?.label || feature.properties?.name,
        description: feature.properties?.label || feature.properties?.name,
        country: feature.properties?.country,
        region: feature.properties?.region,
        locality: feature.properties?.locality,
      }));

      setSuggestions(formattedSuggestions);
      return formattedSuggestions;
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
