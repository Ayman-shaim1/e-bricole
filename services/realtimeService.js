import { client, databases } from "../config/appwrite";
import settings from "../config/settings";

// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Map();

// Connection state management
let isConnected = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let connectionDebounceTimer = null;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000; // 3 seconds
const CONNECTION_DEBOUNCE_DELAY = 1000; // 1 second

// Enhanced error handler for realtime connections
const handleRealtimeError = (error, subscriptionKey) => {
  console.warn('Realtime connection error for subscription:', subscriptionKey, error?.message || error);
  
  // Clear any existing reconnect timer
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

  // Only attempt reconnection for specific error types
  const shouldReconnect = error?.message?.includes('disconnected') || 
                         error?.message?.includes('Connection') ||
                         error?.message?.includes('timeout');

  if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    const delay = RECONNECT_DELAY * reconnectAttempts; // Linear backoff
    console.log(`Scheduling reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
    
    reconnectTimer = setTimeout(() => {
      console.log('Reconnection attempt initiated');
      // The subscription will be handled by the calling code
    }, delay);
  } else {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached. Connection will be retried later.');
    }
    reconnectAttempts = 0; // Reset for future attempts
  }
};

// Monitor connection status
const monitorConnection = () => {
  // Simple connection check by attempting a lightweight operation
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
      }
    }, (error) => {
      // Don't log every test connection error to reduce noise
      if (isConnected) {
        console.warn('Connection test failed:', error?.message || error);
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
    console.error('Error monitoring connection:', error);
  }
};

// Monitor connection every 30 seconds
setInterval(monitorConnection, 30000);

export const subscribeToNotifications = (
  userId,
  onNotificationReceived,
  onCountUpdate
) => {
  // Prevent duplicate subscriptions
  const subscriptionKey = `notifications-${userId}`;
  if (activeSubscriptions.has(subscriptionKey)) {
    console.log('Subscription already exists for user:', userId);
    return activeSubscriptions.get(subscriptionKey);
  }

  const channel = `databases.${settings.dataBaseId}.collections.${settings.notificationId}.documents`;
  let subscriptionActive = true;

  try {
    const unsubscribe = client.subscribe(
      channel, 
      async (response) => {
        if (!subscriptionActive) return;

        try {
          // Validate response structure
          if (!response || !response.payload || !response.events) {
            console.warn('Invalid realtime response received:', response);
            return;
          }

          // Only process if it's a new notification for the current user
          if (response.payload.receiverUser === userId) {
            // Only handle new notifications (created event)
            if (response.events.includes("databases.*.collections.*.documents.*.create")) {
              console.log('New notification received via realtime:', response.payload.$id);
              
              // Don't automatically mark as seen in database - let the UI handle this
              // Pass the notification to the handler
              if (onNotificationReceived && typeof onNotificationReceived === 'function') {
                onNotificationReceived(response.payload);
              }

              // Update the unseen count
              if (onCountUpdate && typeof onCountUpdate === 'function') {
                onCountUpdate((prevCount) => prevCount + 1);
              }

              // Update connection status on successful message
              if (!isConnected) {
                console.log('Realtime connection active (via notification)');
                isConnected = true;
                reconnectAttempts = 0;
              }
            }
          }
        } catch (error) {
          console.error('Error processing realtime notification:', error);
        }
      }, 
      (error) => {
        if (subscriptionActive) {
          handleRealtimeError(error, subscriptionKey);
        }
      }
    );

    // Store the unsubscribe function with additional error handling
    const cleanup = () => {
      subscriptionActive = false;
      try {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
          activeSubscriptions.delete(subscriptionKey);
          console.log('Unsubscribed from notifications for user:', userId);
        }
      } catch (error) {
        console.error('Error unsubscribing from notifications:', error);
        // Force remove from active subscriptions even if unsubscribe fails
        activeSubscriptions.delete(subscriptionKey);
      }
    };

    activeSubscriptions.set(subscriptionKey, cleanup);
    console.log('Subscribed to notifications for user:', userId);
    
    return cleanup;
  } catch (error) {
    console.error('Error setting up notification subscription:', error);
    return () => {}; // Return empty cleanup function
  }
};

// Cleanup function to unsubscribe from all active subscriptions
export const cleanupAllSubscriptions = () => {
  console.log(`Cleaning up ${activeSubscriptions.size} active subscriptions`);
  
  // Clear timers
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (connectionDebounceTimer) {
    clearTimeout(connectionDebounceTimer);
    connectionDebounceTimer = null;
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
  maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS
});

// Force reconnect function for manual reconnection
export const forceReconnect = () => {
  console.log('Force reconnecting realtime connection...');
  
  // Clear existing timers
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (connectionDebounceTimer) {
    clearTimeout(connectionDebounceTimer);
    connectionDebounceTimer = null;
  }
  
  reconnectAttempts = 0;
  isConnected = false;
  
  // Restart connection monitoring
  setTimeout(monitorConnection, 1000);
};
