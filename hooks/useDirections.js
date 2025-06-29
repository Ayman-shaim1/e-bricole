import { useState, useCallback } from "react";
import settings from "../config/settings";

const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min`;
  }
};

// Fonction de calcul de distance approximative (formule de Haversine) - fallback
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

      console.log("Récupération de la route réelle avec OSRM...");
      
      // Utiliser OSRM (Open Source Routing Machine) - gratuit et fiable
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
        
        console.log("URL OSRM:", osrmUrl);
        
        const response = await fetch(osrmUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Réponse OSRM:", data);
          
          if (data.routes && data.routes[0] && data.routes[0].geometry) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates;
            
            console.log("Route trouvée avec", coordinates.length, "points");
            
            const routeDirections = {
              coordinates: coordinates, // Format [longitude, latitude]
              distance: route.distance, // En mètres
              formattedDistance: formatDistance(route.distance),
              duration: route.duration, // En secondes
              formattedDuration: formatDuration(route.duration),
            };
            
            setDirections(routeDirections);
            return routeDirections;
          }
        } else {
          console.log("Erreur HTTP OSRM:", response.status);
        }
      } catch (apiError) {
        console.log("Erreur OSRM:", apiError.message);
      }

      // Essayer Google Directions API si disponible
      try {
        console.log("Tentative avec Google Directions...");
        const googleUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&key=YOUR_GOOGLE_API_KEY`;
        
        // Note: Cette partie nécessite une clé API Google valide
        // const response = await fetch(googleUrl);
        // if (response.ok) { ... }
        
      } catch (googleError) {
        console.log("Google Directions non disponible:", googleError.message);
      }

      // Fallback vers calcul local si toutes les APIs échouent
      console.log("Utilisation du calcul de distance local (fallback)...");
      
      const distance = calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude);
      const formattedDistance = formatDistance(distance * 1000); // Convertir en mètres
      
      const localDirections = {
        coordinates: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude]
        ],
        distance: distance * 1000,
        formattedDistance,
        duration: distance * 60 * 60, // Estimation: 1 minute par km en secondes
        formattedDuration: formatDuration(distance * 60),
      };
      
      setDirections(localDirections);
      return localDirections;
      
    } catch (err) {
      console.error("Erreur de calcul de directions:", err.message);
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
