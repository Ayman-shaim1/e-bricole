/**
 * Network utilities for handling API requests with retry logic and fallback mechanisms
 */

import NetInfo from '@react-native-community/netinfo';
import { formatOfflineAddress, searchOfflineAddress, shouldUseOfflineMode } from './offlineGeocoding';

// Check if device is online with more detailed diagnostics
export const isOnline = async () => {
  try {
    // First check network info
    const netInfo = await NetInfo.fetch();
    console.log('Network Info:', {
      isConnected: netInfo.isConnected,
      isInternetReachable: netInfo.isInternetReachable,
      type: netInfo.type,
      isWifi: netInfo.type === 'wifi',
      isCellular: netInfo.type === 'cellular',
    });

    if (!netInfo.isConnected) {
      console.log('Device is not connected to any network');
      return false;
    }

    // Test with multiple endpoints
    const testEndpoints = [
      'https://www.google.com',
      'https://httpbin.org/get',
      'https://nominatim.openstreetmap.org/status.php'
    ];

    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint, { 
          method: 'HEAD',
          timeout: 5000 
        });
        if (response.ok) {
          console.log(`Network test successful with ${endpoint}`);
          return true;
        }
      } catch (error) {
        console.log(`Network test failed with ${endpoint}:`, error.message);
      }
    }

    console.log('All network tests failed');
    return false;
  } catch (error) {
    console.log('Network connectivity check failed:', error.message);
    return false;
  }
};

// Enhanced fetch with timeout and retry logic
export const fetchWithRetry = async (url, options = {}, maxRetries = 2) => {
  const { timeout = 15000, ...fetchOptions } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt + 1}/${maxRetries + 1}:`, url);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Geocoding service with multiple fallbacks
export const geocodeWithFallback = async (lat, lon) => {
  const services = [
    {
      name: 'Nominatim (with User-Agent)',
      url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'E-Bricole-App/1.0',
      }
    },
    {
      name: 'Nominatim (no User-Agent)',
      url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      headers: {
        'Accept': 'application/json',
      }
    },
    {
      name: 'Nominatim (minimal params)',
      url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      headers: {
        'Accept': 'application/json',
      }
    },
    {
      name: 'Alternative service (httpbin for testing)',
      url: `https://httpbin.org/json`,
      headers: {
        'Accept': 'application/json',
      },
      isTest: true
    }
  ];

  let lastError = null;

  for (const service of services) {
    try {
      console.log(`Trying ${service.name}...`);
      
      if (service.isTest) {
        // For testing purposes, return mock data
        console.log('Using test service, returning mock data');
        return {
          display_name: `Test Location at ${lat}, ${lon}`,
          address: {
            road: 'Test Street',
            city: 'Test City',
            country: 'Test Country',
            house_number: '123',
            postcode: '12345',
          },
          lat: parseFloat(lat),
          lon: parseFloat(lon),
        };
      }
      
      const response = await fetchWithRetry(service.url, {
        headers: service.headers,
        timeout: 10000
      });
      
      const data = await response.json();
      
      if (data && data.display_name) {
        return {
          display_name: data.display_name,
          address: {
            road: data.address?.road,
            city: data.address?.city || data.address?.town,
            country: data.address?.country,
            house_number: data.address?.house_number,
            postcode: data.address?.postcode,
          },
          lat: parseFloat(data.lat),
          lon: parseFloat(data.lon),
        };
      }
    } catch (error) {
      console.log(`${service.name} failed:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  // If all services failed, use offline fallback
  if (lastError && shouldUseOfflineMode(lastError)) {
    console.log('All network services failed, using offline fallback');
    return formatOfflineAddress(lat, lon);
  }
  
  throw new Error('All geocoding services failed');
};

// Address search with multiple fallbacks
export const searchAddressWithFallback = async (query) => {
  const services = [
    {
      name: 'Nominatim (with User-Agent)',
      url: `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'E-Bricole-App/1.0',
      }
    },
    {
      name: 'Nominatim (no User-Agent)',
      url: `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      headers: {
        'Accept': 'application/json',
      }
    },
    {
      name: 'Nominatim (minimal params)',
      url: `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=3`,
      headers: {
        'Accept': 'application/json',
      }
    }
  ];

  let lastError = null;

  for (const service of services) {
    try {
      console.log(`Trying ${service.name} for search...`);
      const response = await fetchWithRetry(service.url, {
        headers: service.headers,
        timeout: 10000
      });
      
      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        return data.map((item) => ({
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
      }
    } catch (error) {
      console.log(`${service.name} search failed:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  // If all services failed, use offline fallback
  if (lastError && shouldUseOfflineMode(lastError)) {
    console.log('All search services failed, using offline fallback');
    return searchOfflineAddress(query);
  }
  
  return [];
}; 