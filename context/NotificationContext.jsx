import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getUnseenNotificationCount } from '../services/notificationService';
import { subscribeToNotifications, getConnectionStatus, cleanupAllSubscriptions } from '../services/realtimeService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unseenCount, setUnseenCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false });
  
  // Use refs to prevent duplicate subscriptions
  const unsubscribeRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const connectionCheckIntervalRef = useRef(null);

  // Initialize notification count
  useEffect(() => {
    if (user?.$id) {
      getUnseenNotificationCount(user.$id).then(setUnseenCount);
    } else {
      setUnseenCount(0);
    }
  }, [user?.$id]);

  // Set up single realtime subscription for the entire app
  useEffect(() => {
    if (!user?.$id || isSubscribedRef.current) {
      return;
    }

    const setupGlobalSubscription = () => {
      try {
        console.log('Setting up global notification subscription for user:', user.$id);
        
        unsubscribeRef.current = subscribeToNotifications(
          user.$id,
          (newNotification) => {
            console.log('New notification received globally:', newNotification.$id);
            // Don't handle the notification here, let individual components handle them
            // This just ensures the realtime connection is active
          },
          (newCount) => {
            console.log('Updating global unseen count:', newCount);
            setUnseenCount(newCount);
          }
        );

        isSubscribedRef.current = true;
        console.log('Global notification subscription established');
      } catch (error) {
        console.error('Error setting up global notification subscription:', error);
      }
    };

    setupGlobalSubscription();

    // Monitor connection status
    connectionCheckIntervalRef.current = setInterval(() => {
      const status = getConnectionStatus();
      setConnectionStatus(status);
    }, 15000); // Check every 15 seconds

    return () => {
      console.log('Cleaning up global notification subscription');
      
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (error) {
          console.error('Error cleaning up global subscription:', error);
        }
      }

      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
      }

      // Cleanup all subscriptions when user changes
      cleanupAllSubscriptions();
      
      isSubscribedRef.current = false;
      unsubscribeRef.current = null;
    };
  }, [user?.$id]);

  // Update unseen count manually
  const updateUnseenCount = async () => {
    if (user?.$id) {
      const count = await getUnseenNotificationCount(user.$id);
      setUnseenCount(count);
      return count;
    }
    return 0;
  };

  const value = {
    unseenCount,
    setUnseenCount,
    connectionStatus,
    updateUnseenCount,
    isSubscribed: isSubscribedRef.current,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 