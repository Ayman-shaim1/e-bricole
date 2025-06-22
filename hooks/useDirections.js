import { useState, useCallback } from "react";
import settings from "../config/settings";

const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

// Fonction de calcul de distance approximative (formule de Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const useDirections = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [directions, setDirections] = useState(null);

  const getDirections = useCallback(async (start, end) => {
    try {
      setLoading(true);
      setError(null);

      // Utiliser directement le calcul de distance local
      console.log("Utilisation du calcul de distance local...");
      
      const distance = calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude);
      const formattedDistance = formatDistance(distance * 1000); // Convertir en mètres
      
      const localDirections = {
        coordinates: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude]
        ],
        distance: distance * 1000,
        formattedDistance,
        duration: distance * 60, // Estimation: 1 minute par km
      };
      
      setDirections(localDirections);
      return localDirections;
      
    } catch (err) {
      console.error("Erreur de calcul de distance:", err.message);
      setError(err instanceof Error ? err.message : "An error occurred");
      setDirections(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    directions,
    getDirections,
  };
};
