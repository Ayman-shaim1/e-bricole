import { useEffect, useRef } from 'react';
import { subscribeToNotifications, cleanupAllSubscriptions, getConnectionStatus } from '../services/realtimeService';
import { useNotifications } from '../context/NotificationContext';

export const useNotificationListeners = (userId) => {
  const { setUnseenCount } = useNotifications();
  const unsubscribeRef = useRef(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!userId || isSubscribedRef.current) {
      return;
    }

    const setupSubscription = () => {
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

        isSubscribedRef.current = true;
        console.log('Notification listeners set up for user:', userId);
      } catch (error) {
        console.error('Error setting up notification listeners:', error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
          isSubscribedRef.current = false;
          console.log('Notification listeners cleaned up for user:', userId);
        } catch (error) {
          console.error('Error cleaning up notification listeners:', error);
        }
      }
    };
  }, [userId, setUnseenCount]);

  // Cleanup function for component unmount
  const cleanup = () => {
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
        isSubscribedRef.current = false;
      } catch (error) {
        console.error('Error in cleanup:', error);
      }
    }
  };

  return {
    cleanup,
    getConnectionStatus
  };
};
