/**
 * Offline geocoding utilities for when network services are unavailable
 */

// Simple offline address formatter
export const formatOfflineAddress = (lat, lon) => {
  // Basic coordinate-based address formatting
  const latStr = Math.abs(lat).toFixed(6);
  const lonStr = Math.abs(lon).toFixed(6);
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  
  return {
    display_name: `${latStr}°${latDir}, ${lonStr}°${lonDir}`,
    address: {
      road: 'Coordonnées GPS',
      city: 'Localisation',
      country: 'Position actuelle',
      house_number: null,
      postcode: null,
    },
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    isOffline: true,
  };
};

// Offline address search (returns basic suggestions)
export const searchOfflineAddress = (query) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Return basic suggestions based on common patterns
  const suggestions = [
    {
      id: 'offline-1',
      displayName: `${query} (recherche hors ligne)`,
      latitude: 0,
      longitude: 0,
      formattedAddress: `${query} - Service hors ligne`,
      description: 'Recherche hors ligne - connectez-vous pour plus de précision',
      country: 'Hors ligne',
      region: null,
      locality: null,
      isOffline: true,
    }
  ];

  return suggestions;
};

// Check if we should use offline mode
export const shouldUseOfflineMode = (error) => {
  if (!error) return false;
  
  const offlineErrors = [
    'Network request failed',
    'fetch',
    'timeout',
    'ECONNREFUSED',
    'ENOTFOUND',
    'All geocoding services failed'
  ];
  
  return offlineErrors.some(offlineError => 
    error.message.toLowerCase().includes(offlineError.toLowerCase())
  );
}; 