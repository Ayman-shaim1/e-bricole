import { useState, useCallback } from "react";
import settings from "../config/settings";

const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

export const useDirections = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [directions, setDirections] = useState(null);

  const getDirections = useCallback(async (start, end) => {
    try {
      setLoading(true);
      setError(null);

      const BASE_URL = "https://api.openrouteservice.org/v2";
      const ENDPOINT = "/directions/driving-car";
      const url = `${BASE_URL}${ENDPOINT}?api_key=${settings.openRouteApiKey}&start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch directions");
      }

      const data = await response.json();
      
      if (data.features && data.features[0]) {
        const feature = data.features[0];
        const coordinates = feature.geometry.coordinates;
        const { distance, duration } = feature.properties.segments[0];
        const formattedDistance = formatDistance(distance);

        setDirections({
          coordinates,
          distance,
          formattedDistance,
          duration,
        });
        return {
          coordinates,
          distance,
          formattedDistance,
          duration,
        };
      } else {
        throw new Error("No route found");
      }
    } catch (err) {
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
