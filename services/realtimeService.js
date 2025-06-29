import { client, databases } from "../config/appwrite";
import settings from "../config/settings";
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Map();

// Connection state management
let isConnected = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let connectionDebounceTimer = null;
let networkCheckTimer = null;
let lastNetworkState = null;
let appState = 'active';

// Configuration constants
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 2000; // 2 seconds
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const CONNECTION_DEBOUNCE_DELAY = 1000; // 1 second
const NETWORK_CHECK_INTERVAL = 5000; // 5 seconds

// Monitor app state changes
AppState.addEventListener('change', (nextAppState) => {
  const previousAppState = appState;
  appState = nextAppState;
  
  if (previousAppState === 'background' && nextAppState === 'active') {
    console.log('App resumed from background - checking connectivity');
    checkNetworkAndReconnect();
  } else if (nextAppState === 'background') {
    console.log('App went to background - pausing reconnection attempts');
    pauseReconnectionAttempts();
  }
});

// Check network connectivity before attempting reconnection
const checkNetworkConnectivity = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    lastNetworkState = netInfo;
    
    // More detailed network check
    if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
      console.log('No network connectivity detected:', {
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        type: netInfo.type
      });
      return false;
    }
    
    // For cellular connections, be more cautious
    if (netInfo.type === 'cellular' && netInfo.details?.cellularGeneration === '2g') {
      console.log('Slow cellular connection detected - delaying reconnection');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Network connectivity check failed:', error.message);
    return false;
  }
};

// Pause reconnection attempts (e.g., when app goes to background)
const pauseReconnectionAttempts = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (networkCheckTimer) {
    clearTimeout(networkCheckTimer);
    networkCheckTimer = null;
  }
};

// Resume reconnection attempts with network check
const checkNetworkAndReconnect = async () => {
  if (appState !== 'active') {
    console.log('App not active - skipping reconnection');
    return;
  }
  
  const hasNetwork = await checkNetworkConnectivity();
  if (!hasNetwork) {
    console.log('No network available - scheduling next check');
    scheduleNetworkCheck();
    return;
  }
  
  // Network is available, attempt to restore realtime connection
  if (!isConnected && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    console.log('Network available - attempting to restore realtime connection');
    // The actual reconnection will be handled by the subscription code
  }
};

// Schedule periodic network checks when disconnected
const scheduleNetworkCheck = () => {
  if (networkCheckTimer) {
    clearTimeout(networkCheckTimer);
  }
  
  networkCheckTimer = setTimeout(async () => {
    if (appState === 'active' && !isConnected) {
      await checkNetworkAndReconnect();
    }
  }, NETWORK_CHECK_INTERVAL);
};

// Enhanced error handler for realtime connections with better backoff
const handleRealtimeError = async (error, subscriptionKey) => {
  // Don't log spam when app is in background
  if (appState !== 'active') {
    return;
  }
  
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // Check for specific error types that indicate network issues
  const isNetworkError = errorMessage.includes('disconnected') ||
                         errorMessage.includes('Connection reset') ||
                         errorMessage.includes('Connection') ||
                         errorMessage.includes('timeout') ||
                         errorMessage.includes('INVALID_STATE_ERR') ||
                         errorMessage.includes('Stream end encountered') ||
                         errorMessage.includes('OSStatus error');

  // Only log network errors once per minute to reduce spam
  const now = Date.now();
  if (!handleRealtimeError.lastLogTime || now - handleRealtimeError.lastLogTime > 60000) {
    console.warn(`Realtime connection error for ${subscriptionKey}:`, errorMessage);
    handleRealtimeError.lastLogTime = now;
  }
  
  // Clear any existing timers
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Set connection status to false with debouncing
  if (connectionDebounceTimer) {
    clearTimeout(connectionDebounceTimer);
  }
  
  connectionDebounceTimer = setTimeout(() => {
    isConnected = false;
  }, CONNECTION_DEBOUNCE_DELAY);

  // Only attempt reconnection for network-related errors and when app is active
  if (isNetworkError && appState === 'active' && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    // Check network connectivity before attempting reconnection
    const hasNetwork = await checkNetworkConnectivity();
    
    if (!hasNetwork) {
      console.log('Network unavailable - scheduling network check instead of reconnection');
      scheduleNetworkCheck();
      return;
    }
    
    reconnectAttempts++;
    
    // Exponential backoff with jitter
    const baseDelay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), MAX_RECONNECT_DELAY);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const delay = baseDelay + jitter;
    
    console.log(`Scheduling reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${Math.round(delay)}ms`);
    
    reconnectTimer = setTimeout(async () => {
      if (appState === 'active') {
        console.log('Reconnection attempt initiated');
        // The subscription will be handled by the calling code
      }
    }, delay);
  } else {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('Max reconnection attempts reached. Will retry when network is available.');
      scheduleNetworkCheck(); // Continue checking network periodically
    }
    
    // Reset reconnect attempts after a longer delay
    setTimeout(() => {
      reconnectAttempts = 0;
    }, 60000); // Reset after 1 minute
  }
};

// Monitor connection status with network awareness
const monitorConnection = async () => {
  // Skip monitoring when app is in background
  if (appState !== 'active') {
    return;
  }
  
  // Check network first
  const hasNetwork = await checkNetworkConnectivity();
  if (!hasNetwork) {
    if (isConnected) {
      console.log('Network lost - marking as disconnected');
      isConnected = false;
    }
    return;
  }
  
  try {
    // This won't create an actual subscription, just tests the connection
    const testChannel = `databases.${settings.dataBaseId}.collections.${settings.notificationId}.documents`;
    
    // Test connection without creating persistent subscription
    const testUnsubscribe = client.subscribe(testChannel, () => {
      if (!isConnected) {
        console.log('Realtime connection restored');
        isConnected = true;
        reconnectAttempts = 0;
        
        // Clear timers
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        if (connectionDebounceTimer) {
          clearTimeout(connectionDebounceTimer);
          connectionDebounceTimer = null;
        }
        if (networkCheckTimer) {
          clearTimeout(networkCheckTimer);
          networkCheckTimer = null;
        }
      }
    }, (error) => {
      // Don't log every test connection error to reduce noise
      if (isConnected && appState === 'active') {
        handleRealtimeError(error, 'connection-test');
      }
    });

    // Clean up test subscription immediately
    setTimeout(() => {
      try {
        if (testUnsubscribe && typeof testUnsubscribe === 'function') {
          testUnsubscribe();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }, 100);
    
  } catch (error) {
    if (appState === 'active') {
      console.error('Error monitoring connection:', error);
    }
  }
};

// Monitor connection every 30 seconds, but only when app is active
setInterval(() => {
  if (appState === 'active') {
    monitorConnection();
  }
}, 30000);

// Listen for network state changes
NetInfo.addEventListener(state => {
  const wasConnected = lastNetworkState?.isConnected;
  const isNowConnected = state.isConnected;
  
  lastNetworkState = state;
  
  // If network was restored and app is active, check if we need to reconnect
  if (!wasConnected && isNowConnected && appState === 'active' && !isConnected) {
    console.log('Network restored - attempting to restore realtime connection');
    setTimeout(() => {
      checkNetworkAndReconnect();
    }, 1000); // Small delay to let network stabilize
  } else if (!isNowConnected && isConnected) {
    console.log('Network lost - marking realtime as disconnected');
    isConnected = false;
    pauseReconnectionAttempts();
  }
});

export const subscribeToNotifications = (userId, onNewNotification) => {
  const channel = `databases.${settings.dataBaseId}.collections.${settings.notificationId}.documents`;

  try {
    const unsubscribe = client.subscribe(
      channel, 
      (response) => {
        // Pass the full response to the callback for custom handling
        if (onNewNotification) {
          onNewNotification(response);
        }
      },
      (error) => {
        handleRealtimeError(error, 'notifications');
      }
    );

    isConnected = true;
    return unsubscribe;
  } catch (error) {
    return () => {}; // Return empty cleanup function
  }
};

// Cleanup function to unsubscribe from all active subscriptions
export const cleanupAllSubscriptions = () => {
  console.log(`Cleaning up ${activeSubscriptions.size} active subscriptions`);
  
  // Clear all timers
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (connectionDebounceTimer) {
    clearTimeout(connectionDebounceTimer);
    connectionDebounceTimer = null;
  }
  if (networkCheckTimer) {
    clearTimeout(networkCheckTimer);
    networkCheckTimer = null;
  }
  
  activeSubscriptions.forEach((cleanup, key) => {
    try {
      cleanup();
      console.log('Cleaned up subscription:', key);
    } catch (error) {
      console.error('Error cleaning up subscription:', key, error);
    }
  });
  activeSubscriptions.clear();
  
  // Reset connection state
  isConnected = false;
  reconnectAttempts = 0;
};

// Get connection status with more detailed information
export const getConnectionStatus = () => ({
  isConnected,
  reconnectAttempts,
  activeSubscriptionsCount: activeSubscriptions.size,
  maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
  appState,
  lastNetworkState: lastNetworkState ? {
    isConnected: lastNetworkState.isConnected,
    isInternetReachable: lastNetworkState.isInternetReachable,
    type: lastNetworkState.type
  } : null
});

// Force reconnect function for manual reconnection
export const forceReconnect = async () => {
  console.log('Force reconnecting realtime connection...');
  
  // Clear existing timers
  pauseReconnectionAttempts();
  
  // Check network first
  const hasNetwork = await checkNetworkConnectivity();
  if (!hasNetwork) {
    console.log('Cannot force reconnect - no network available');
    scheduleNetworkCheck();
    return;
  }
  
  reconnectAttempts = 0;
  isConnected = false;
  
  // Restart connection monitoring
  setTimeout(monitorConnection, 1000);
};
