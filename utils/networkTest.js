/**
 * Network test utilities for debugging connectivity issues
 */

import NetInfo from '@react-native-community/netinfo';
import { isOnline, geocodeWithFallback, searchAddressWithFallback } from './networkUtils';

export const runNetworkTests = async () => {
  console.log('=== Starting Network Tests ===');
  
  // Test 1: Network Info
  console.log('1. Checking network information...');
  const netInfo = await NetInfo.fetch();
  console.log('Network Info:', {
    isConnected: netInfo.isConnected,
    isInternetReachable: netInfo.isInternetReachable,
    type: netInfo.type,
    isWifi: netInfo.type === 'wifi',
    isCellular: netInfo.type === 'cellular',
    details: netInfo.details,
  });
  
  if (!netInfo.isConnected) {
    console.log('❌ Device is not connected to any network');
    return false;
  }
  
  // Test 2: Basic connectivity
  console.log('2. Testing basic connectivity...');
  const online = await isOnline();
  console.log('Online status:', online);
  
  if (!online) {
    console.log('❌ Device appears to be offline');
    return false;
  }
  
  // Test 3: Geocoding test
  console.log('3. Testing reverse geocoding...');
  try {
    const geocodeResult = await geocodeWithFallback(48.8566, 2.3522); // Paris coordinates
    console.log('✅ Geocoding successful:', geocodeResult);
  } catch (error) {
    console.log('❌ Geocoding failed:', error.message);
  }
  
  // Test 4: Address search test
  console.log('4. Testing address search...');
  try {
    const searchResult = await searchAddressWithFallback('Paris');
    console.log('✅ Address search successful:', searchResult.length, 'results');
  } catch (error) {
    console.log('❌ Address search failed:', error.message);
  }
  
  // Test 5: Direct fetch test
  console.log('5. Testing direct fetch to Nominatim...');
  try {
    const response = await fetch('https://nominatim.openstreetmap.org/status.php');
    console.log('✅ Direct Nominatim access:', response.status, response.statusText);
  } catch (error) {
    console.log('❌ Direct Nominatim access failed:', error.message);
  }
  
  console.log('=== Network Tests Complete ===');
  return true;
};

export const testSpecificCoordinates = async (lat, lon) => {
  console.log(`Testing coordinates: ${lat}, ${lon}`);
  
  try {
    const result = await geocodeWithFallback(lat, lon);
    console.log('✅ Geocoding result:', result);
    return result;
  } catch (error) {
    console.log('❌ Geocoding error:', error.message);
    throw error;
  }
};

export const getNetworkDiagnostics = async () => {
  const netInfo = await NetInfo.fetch();
  const online = await isOnline();
  
  return {
    netInfo,
    online,
    timestamp: new Date().toISOString(),
    userAgent: navigator?.userAgent || 'React Native',
    platform: Platform?.OS || 'unknown',
  };
}; 