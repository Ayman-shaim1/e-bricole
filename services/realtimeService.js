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
let isReconnectInProgress = false;
let systemWakeDetected = false;
let lastActivityTime = Date.now();
let isFullyDisconnected = false;

// Configuration constants
const MAX_RECONNECT_ATTEMPTS = 3; // Reduced from 5
const BASE_RECONNECT_DELAY = 3000; // Increased from 2 seconds
const MAX_RECONNECT_DELAY = 60000; // Increased from 30 seconds
const CONNECTION_DEBOUNCE_DELAY = 2000; // Increased from 1 second
const NETWORK_CHECK_INTERVAL = 10000; // Increased from 5 seconds
const SYSTEM_WAKE_THRESHOLD = 30000; // 30 seconds to detect system wake

// Monitor app state changes with system wake detection
AppState.addEventListener('change', (nextAppState) => {
  const previousAppState = appState;
  appState = nextAppState;
  const now = Date.now();
  
  // Detect potential system wake (app was inactive for extended period)
  if (previousAppState !== 'active' && nextAppState === 'active') {
    const inactiveTime = now - lastActivityTime;
    systemWakeDetected = inactiveTime > SYSTEM_WAKE_THRESHOLD;
    
    if (systemWakeDetected) {
      console.log('System wake detected, performing full reset...');
      performFullReconnectAfterWake();
    } else {
      checkNetworkAndReconnect();
    }
  } else if (nextAppState !== 'active') {
    pauseReconnectionAttempts();
    systemWakeDetected = false;
  }
  
  lastActivityTime = now;
});

// Full reset after system wake
const performFullReconnectAfterWake = async () => {
  console.log('Performing full reconnect after system wake...');
  
  // Full cleanup of existing connections
  cleanupAllSubscriptions();
  
  // Reset all state
  isConnected = false;
  reconnectAttempts = 0;
  isReconnectInProgress = false;
  isFullyDisconnected = true;
  systemWakeDetected = false;
  
  // Wait a bit for system to stabilize
  setTimeout(async () => {
    const hasNetwork = await checkNetworkConnectivity();
    if (hasNetwork && appState === 'active') {
      isFullyDisconnected = false;
      console.log('Network available after wake, ready for new connections');
    } else {
      scheduleNetworkCheck();
    }
  }, 3000);
};

// Check network connectivity before attempting reconnection
const checkNetworkConnectivity = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    lastNetworkState = netInfo;
    
    // More detailed network check
    if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
      return false;
    }
    
    // For cellular connections, be more cautious
    if (netInfo.type === 'cellular' && netInfo.details?.cellularGeneration === '2g') {
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
  isReconnectInProgress = false;
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (networkCheckTimer) {
    clearTimeout(networkCheckTimer);
    networkCheckTimer = null;
  }
  if (connectionDebounceTimer) {
    clearTimeout(connectionDebounceTimer);
    connectionDebounceTimer = null;
  }
};

// Resume reconnection attempts with network check
const checkNetworkAndReconnect = async () => {
  if (appState !== 'active' || isReconnectInProgress || isFullyDisconnected) {
    return;
  }
  
  const hasNetwork = await checkNetworkConnectivity();
  if (!hasNetwork) {
    scheduleNetworkCheck();
    return;
  }
  
  // Network is available, attempt to restore realtime connection
  if (!isConnected && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    // The actual reconnection will be handled by the subscription code
  }
};

// Schedule periodic network checks when disconnected
const scheduleNetworkCheck = () => {
  if (networkCheckTimer || appState !== 'active') {
    return;
  }
  
  networkCheckTimer = setTimeout(async () => {
    networkCheckTimer = null;
    if (appState === 'active' && !isConnected && !isFullyDisconnected) {
      await checkNetworkAndReconnect();
    }
  }, NETWORK_CHECK_INTERVAL);
};

// Enhanced error handler for realtime connections with better backoff
const handleRealtimeError = async (error, subscriptionKey) => {
  // Don't handle errors when app is in background or during full disconnect
  if (appState !== 'active' || isFullyDisconnected) {
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

  // Check for system-level errors that require full reset
  const isSystemLevelError = errorMessage.includes('INVALID_STATE_ERR') ||
                            errorMessage.includes('OSStatus error -9806') ||
                            errorMessage.includes('Connection reset by peer');

  // Only log errors periodically to reduce spam
  const now = Date.now();
  if (!handleRealtimeError.lastLogTime || now - handleRealtimeError.lastLogTime > 120000) { // 2 minutes
    console.warn(`Realtime connection error for ${subscriptionKey}:`, errorMessage);
    handleRealtimeError.lastLogTime = now;
  }
  
  // If we have system-level errors, treat as a wake scenario
  if (isSystemLevelError && !isReconnectInProgress) {
    console.log('System-level error detected, performing full reset...');
    performFullReconnectAfterWake();
    return;
  }
  
  // Prevent concurrent reconnection attempts
  if (isReconnectInProgress) {
    return;
  }

  // Clear any existing timers
  pauseReconnectionAttempts();

  // Set connection status to false with debouncing
  connectionDebounceTimer = setTimeout(() => {
    isConnected = false;
    connectionDebounceTimer = null;
  }, CONNECTION_DEBOUNCE_DELAY);

  // Only attempt reconnection for network-related errors when conditions are right
  if (isNetworkError && appState === 'active' && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !isFullyDisconnected) {
    // Check network connectivity before attempting reconnection
    const hasNetwork = await checkNetworkConnectivity();
    
    if (!hasNetwork) {
      scheduleNetworkCheck();
      return;
    }
    
    isReconnectInProgress = true;
    reconnectAttempts++;
    
    // Exponential backoff with jitter and caps
    const baseDelay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), MAX_RECONNECT_DELAY);
    const jitter = Math.random() * 2000; // Add up to 2 seconds of jitter
    const delay = baseDelay + jitter;
    
    console.log(`Scheduling reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${Math.round(delay/1000)}s`);
    
    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;
      isReconnectInProgress = false;
      
      if (appState === 'active' && !isFullyDisconnected) {
        // Allow the calling code to handle the actual reconnection
      }
    }, delay);
  } else {
    isReconnectInProgress = false;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('Max reconnection attempts reached. Entering cooldown period...');
      // Enter a longer cooldown period
      setTimeout(() => {
        reconnectAttempts = 0;
        if (appState === 'active' && !isFullyDisconnected) {
          scheduleNetworkCheck();
        }
      }, 300000); // 5 minutes cooldown
    }
  }
};

// Monitor connection status with network awareness
const monitorConnection = async () => {
  // Skip monitoring when app is in background or during full disconnect
  if (appState !== 'active' || isFullyDisconnected) {
    return;
  }
  
  // Check network first
  const hasNetwork = await checkNetworkConnectivity();
  if (!hasNetwork) {
    if (isConnected) {
      isConnected = false;
    }
    return;
  }
  
  // Don't create test connections if we're already in a reconnect process
  if (isReconnectInProgress) {
    return;
  }
  
  try {
    // Only test if we think we should be connected
    if (!isConnected && reconnectAttempts === 0) {
      const testChannel = `databases.${settings.dataBaseId}.collections.${settings.notificationId}.documents`;
      
      // Test connection without creating persistent subscription
      const testUnsubscribe = client.subscribe(testChannel, () => {
        if (!isConnected) {
          isConnected = true;
          reconnectAttempts = 0;
          isReconnectInProgress = false;
          
          // Clear timers
          pauseReconnectionAttempts();
        }
      }, (error) => {
        // Only handle test errors if we're supposed to be connected
        if (isConnected && appState === 'active' && !isFullyDisconnected) {
          handleRealtimeError(error, 'connection-test');
        }
      });

      // Clean up test subscription quickly
      setTimeout(() => {
        try {
          if (testUnsubscribe && typeof testUnsubscribe === 'function') {
            testUnsubscribe();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 500);
    }
    
  } catch (error) {
    if (appState === 'active' && !isFullyDisconnected) {
      console.error('Error monitoring connection:', error);
    }
  }
};

// Monitor connection less frequently and only when appropriate
let connectionMonitorInterval = null;

const startConnectionMonitoring = () => {
  if (connectionMonitorInterval) {
    return;
  }
  
  connectionMonitorInterval = setInterval(() => {
    if (appState === 'active' && !isFullyDisconnected) {
      monitorConnection();
    }
  }, 60000); // Check every minute instead of 30 seconds
};

const stopConnectionMonitoring = () => {
  if (connectionMonitorInterval) {
    clearInterval(connectionMonitorInterval);
    connectionMonitorInterval = null;
  }
};

// Start monitoring
startConnectionMonitoring();

// Listen for network state changes
NetInfo.addEventListener(state => {
  const wasConnected = lastNetworkState?.isConnected;
  const isNowConnected = state.isConnected;
  
  lastNetworkState = state;
  
  // If network was restored and app is active, check if we need to reconnect
  if (!wasConnected && isNowConnected && appState === 'active' && !isConnected && !isFullyDisconnected) {
    setTimeout(() => {
      checkNetworkAndReconnect();
    }, 2000); // Longer delay to let network stabilize
  } else if (!isNowConnected && isConnected) {
    isConnected = false;
    pauseReconnectionAttempts();
  }
});

export const subscribeToNotifications = (userId, onNewNotification, onCountUpdate) => {
  // Don't create new subscriptions during full disconnect
  if (isFullyDisconnected) {
    console.log('Delaying notification subscription until system is ready...');
    return () => {};
  }
  
  const channel = `databases.${settings.dataBaseId}.collections.${settings.notificationId}.documents`;

  try {
    const unsubscribe = client.subscribe(
      channel, 
      (response) => {
        // Update connection status on successful response
        if (!isConnected) {
          isConnected = true;
          reconnectAttempts = 0;
          isReconnectInProgress = false;
        }
        
        // Pass the full response to the callback for custom handling
        if (onNewNotification) {
          onNewNotification(response);
        }
        
        // Handle count updates if callback is provided
        if (onCountUpdate && response.payload) {
          // You might need to adjust this based on your notification structure
          onCountUpdate(response.payload);
        }
      },
      (error) => {
        handleRealtimeError(error, 'notifications');
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error creating notification subscription:', error);
    return () => {}; // Return empty cleanup function
  }
};

export const subscribeToMessages = (userId, onMessageUpdate) => {
  // Don't create new subscriptions during full disconnect
  if (isFullyDisconnected) {
    console.log('Delaying message subscription until system is ready...');
    return () => {};
  }
  
  const subscriptionKey = `messages-${userId}`;

  if (activeSubscriptions.has(subscriptionKey)) {
    return activeSubscriptions.get(subscriptionKey);
  }

  try {
    const channel = `databases.${settings.dataBaseId}.collections.${settings.messageId}.documents`;
    
    const unsubscribe = client.subscribe(
      channel,
      (response) => {
        // Update connection status on successful response
        if (!isConnected) {
          isConnected = true;
          reconnectAttempts = 0;
          isReconnectInProgress = false;
        }
        
        if (onMessageUpdate) {
          onMessageUpdate(response);
        }
      },
      (error) => {
        handleRealtimeError(error, subscriptionKey);
      }
    );

    activeSubscriptions.set(subscriptionKey, unsubscribe);
    return unsubscribe;
  } catch (error) {
    console.error('Error creating message subscription:', error);
    return () => {};
  }
};

// Cleanup function to unsubscribe from all active subscriptions
export const cleanupAllSubscriptions = () => {
  // Stop monitoring
  stopConnectionMonitoring();
  
  // Clear all timers
  pauseReconnectionAttempts();
  
  activeSubscriptions.forEach((cleanup, key) => {
    try {
      cleanup();
    } catch (error) {
      // Silent cleanup
    }
  });
  activeSubscriptions.clear();
  
  // Reset connection state
  isConnected = false;
  reconnectAttempts = 0;
  isReconnectInProgress = false;
  
  // Restart monitoring after cleanup
  setTimeout(() => {
    startConnectionMonitoring();
  }, 1000);
};

// Get connection status with more detailed information
export const getConnectionStatus = () => ({
  isConnected,
  reconnectAttempts,
  activeSubscriptionsCount: activeSubscriptions.size,
  maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
  appState,
  isReconnectInProgress,
  isFullyDisconnected,
  systemWakeDetected,
  lastNetworkState: lastNetworkState ? {
    isConnected: lastNetworkState.isConnected,
    isInternetReachable: lastNetworkState.isInternetReachable,
    type: lastNetworkState.type
  } : null
});

// Force reconnect function for manual reconnection
export const forceReconnect = async () => {
  console.log('Force reconnect requested...');
  
  // Clear existing timers and reset state
  pauseReconnectionAttempts();
  
  // Check network first
  const hasNetwork = await checkNetworkConnectivity();
  if (!hasNetwork) {
    console.log('No network available for force reconnect');
    scheduleNetworkCheck();
    return;
  }
  
  // Reset reconnection state
  reconnectAttempts = 0;
  isConnected = false;
  isReconnectInProgress = false;
  isFullyDisconnected = false;
  
  // Restart connection monitoring
  setTimeout(() => {
    if (!connectionMonitorInterval) {
      startConnectionMonitoring();
    }
    monitorConnection();
  }, 2000);
};
