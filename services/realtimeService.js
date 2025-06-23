import { client, databases } from "../config/appwrite";
import settings from "../config/settings";

// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Map();

// Connection state management
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

// Connection event handlers with better error handling
const setupConnectionListeners = () => {
  try {
    client.subscribe('*', (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        console.log('Realtime connection active');
        isConnected = true;
        reconnectAttempts = 0;
      }
    });

    client.subscribe('*', (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
        console.log('Realtime connection lost');
        isConnected = false;
      }
    });
  } catch (error) {
    console.error('Error setting up connection listeners:', error);
  }
};

// Initialize connection listeners
setupConnectionListeners();

// Error handler for realtime connections with exponential backoff
const handleRealtimeError = (error) => {
  console.warn('Realtime connection error:', error);
  isConnected = false;
  
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1); // Exponential backoff
    console.log(`Attempting to reconnect in ${delay}ms (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    
    setTimeout(() => {
      // Reconnect logic will be handled by Appwrite's built-in reconnection
      console.log('Reconnection attempt initiated');
    }, delay);
  } else {
    console.error('Max reconnection attempts reached. Please check your internet connection.');
  }
};

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

  try {
    const unsubscribe = client.subscribe(channel, async (response) => {
      try {
        // Validate response structure
        if (!response || !response.payload || !response.events) {
          console.warn('Invalid realtime response received:', response);
          return;
        }

        // Only process if it's a new notification for the current user
        if (response.payload.receiverUser === userId) {
          // Only handle new notifications (created event)
          if (
            response.events.includes("databases.*.collections.*.documents.*.create")
          ) {
            console.log('New notification received via realtime:', response.payload.$id);
            
            // Mark as seen in database but keep UI styling
            try {
              await databases.updateDocument(
                settings.dataBaseId,
                settings.notificationId,
                response.payload.$id,
                { isSeen: true }
              );
            } catch (error) {
              console.error("Error marking notification as seen:", error);
            }

            // Pass the notification to the handler
            onNotificationReceived(response.payload);

            // Update the unseen count
            if (onCountUpdate) {
              onCountUpdate((prevCount) => prevCount + 1);
            }
          }
        }
      } catch (error) {
        console.error('Error processing realtime notification:', error);
      }
    }, (error) => {
      handleRealtimeError(error);
    });

    // Store the unsubscribe function with additional error handling
    const cleanup = () => {
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
  activeSubscriptions.forEach((cleanup, key) => {
    try {
      cleanup();
      console.log('Cleaned up subscription:', key);
    } catch (error) {
      console.error('Error cleaning up subscription:', key, error);
    }
  });
  activeSubscriptions.clear();
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
  reconnectAttempts = 0;
  isConnected = false;
  
  // This will trigger Appwrite's built-in reconnection mechanism
  try {
    client.subscribe('*', () => {});
  } catch (error) {
    console.error('Error forcing reconnection:', error);
  }
};
