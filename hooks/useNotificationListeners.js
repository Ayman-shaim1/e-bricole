import { useEffect, useRef, useCallback } from 'react';
import { subscribeToNotifications, cleanupAllSubscriptions, getConnectionStatus, forceReconnect } from '../services/realtimeService';
import { useNotifications } from '../context/NotificationContext';
import { AppState } from 'react-native';

export const useNotificationListeners = (userId) => {
  const { setUnseenCount } = useNotifications();
  const unsubscribeRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  const lastUserIdRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isSubscribedRef.current = false;
        console.log('Notification listeners cleaned up for user:', lastUserIdRef.current);
      } catch (error) {
        console.error('Error cleaning up notification listeners:', error);
      }
    }
  }, []);

  // Setup subscription with retry logic
  const setupSubscription = useCallback((userId) => {
    if (!userId || isSubscribedRef.current) {
      return;
    }

    const connectionStatus = getConnectionStatus();
    
    // Don't create subscription if system is in full disconnect mode
    if (connectionStatus.isFullyDisconnected) {
      console.log('Delaying notification subscription setup - system in full disconnect mode');
      
      // Retry after system stabilizes
      retryTimeoutRef.current = setTimeout(() => {
        retryTimeoutRef.current = null;
        if (AppState.currentState === 'active' && !isSubscribedRef.current) {
          setupSubscription(userId);
        }
      }, 5000);
      return;
    }

    try {
      const handleNewNotification = (newNotification) => {
        console.log('New notification received:', newNotification.$id);
        // The notification will be handled by the notifications screen
      };

      const handleCountUpdate = (newCount) => {
        setUnseenCount(newCount);
      };

      unsubscribeRef.current = subscribeToNotifications(
        userId,
        handleNewNotification,
        handleCountUpdate
      );

      if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
        isSubscribedRef.current = true;
        lastUserIdRef.current = userId;
        console.log('Notification listeners set up for user:', userId);
      } else {
        console.warn('Failed to set up notification subscription, will retry...');
        // Retry after a delay
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          if (AppState.currentState === 'active' && !isSubscribedRef.current) {
            setupSubscription(userId);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
      // Retry after error
      retryTimeoutRef.current = setTimeout(() => {
        retryTimeoutRef.current = null;
        if (AppState.currentState === 'active' && !isSubscribedRef.current) {
          setupSubscription(userId);
        }
      }, 5000);
    }
  }, [setUnseenCount]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && userId && !isSubscribedRef.current) {
        // App became active and we don't have a subscription, try to set it up
        setTimeout(() => {
          setupSubscription(userId);
        }, 1000);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [userId, setupSubscription]);

  // Main effect for setting up subscription
  useEffect(() => {
    // Clean up if user changed
    if (lastUserIdRef.current && lastUserIdRef.current !== userId) {
      cleanup();
    }

    if (!userId) {
      cleanup();
      return;
    }

    // Setup subscription for new user
    setupSubscription(userId);

    return cleanup;
  }, [userId, setupSubscription, cleanup]);

  // Manual reconnect function
  const manualReconnect = useCallback(async () => {
    if (!userId) return;
    
    console.log('Manual reconnect requested for notification listeners');
    
    try {
      // Clean up existing subscription
      cleanup();
      
      // Force a realtime reconnect
      await forceReconnect();
      
      // Wait a bit then setup new subscription
      setTimeout(() => {
        if (AppState.currentState === 'active') {
          setupSubscription(userId);
        }
      }, 2000);
    } catch (error) {
      console.error('Error during manual reconnect:', error);
    }
  }, [userId, cleanup, setupSubscription]);

  return {
    cleanup,
    getConnectionStatus,
    manualReconnect,
    isSubscribed: isSubscribedRef.current
  };
};
