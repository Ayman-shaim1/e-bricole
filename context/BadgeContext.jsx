import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from './AuthContext';
import { getUnseenNotificationCount } from '../services/notificationService';
import { getUnreadMessagesCount } from '../services/messagesService';
import { subscribeToNotifications, subscribeToMessages } from '../services/realtimeService';

const BadgeContext = createContext();

export const useBadge = () => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadge must be used within a BadgeProvider');
  }
  return context;
};

export const BadgeProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch notification count
  const fetchNotificationCount = useCallback(async () => {
    if (!user?.$id) return;
    
    try {
      const count = await getUnseenNotificationCount(user.$id);
      setNotificationCount(count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotificationCount(0);
    }
  }, [user?.$id]);

  // Function to fetch message count
  const fetchMessageCount = useCallback(async () => {
    if (!user?.$id) return;
    
    try {
      const result = await getUnreadMessagesCount(user.$id);
      if (result.success) {
        setMessageCount(result.count);
      } else {
        setMessageCount(0);
      }
    } catch (error) {
      console.error('Error fetching message count:', error);
      setMessageCount(0);
    }
  }, [user?.$id]);

  // Function to load all badge counts
  const loadBadgeCounts = useCallback(async () => {
    if (!user?.$id || !isAuthenticated) {
      setNotificationCount(0);
      setMessageCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    await Promise.all([
      fetchNotificationCount(),
      fetchMessageCount()
    ]);
    setIsLoading(false);
  }, [user?.$id, isAuthenticated, fetchNotificationCount, fetchMessageCount]);

  // Load counts when user changes or app becomes active
  useEffect(() => {
    loadBadgeCounts();
  }, [loadBadgeCounts]);

  // Handle app state changes for real-time sync
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('Badge: App state changed to:', nextAppState);
      
      if (nextAppState === 'active' && user?.$id && isAuthenticated) {
        console.log('Badge: App became active, refreshing counts');
        // Refresh counts when app becomes active
        setTimeout(() => {
          loadBadgeCounts();
        }, 1000);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [user?.$id, isAuthenticated, loadBadgeCounts]);

  // Handle network connectivity changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Badge: Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable
      });
      
      // If network was restored and user is authenticated
      if (state.isConnected && state.isInternetReachable && user?.$id && isAuthenticated) {
        console.log('Badge: Network restored, refreshing counts in 2 seconds');
        // Refresh counts when network is restored
        setTimeout(() => {
          loadBadgeCounts();
        }, 2000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.$id, isAuthenticated, loadBadgeCounts]);

  // Subscribe to real-time updates with retry logic
  useEffect(() => {
    if (!user?.$id || !isAuthenticated) return;

    console.log('Badge: Setting up realtime subscriptions for user:', user.$id);

    const setupNotificationSubscription = () => {
      try {
        return subscribeToNotifications(
          user.$id,
          (response) => {
            console.log('Badge: Notification realtime event:', response);
            
            // Check if this notification is for the current user
            const receiverUserId = typeof response.payload?.receiverUser === 'string' 
              ? response.payload.receiverUser 
              : response.payload?.receiverUser?.$id;
              
            if (receiverUserId === user.$id) {
              console.log('Badge: Event types:', response.events);
              
              // For new notifications, check if it's a create event
              const isCreateEvent = response.events?.some(event => 
                event.includes('documents.*.create') || 
                event.includes('.create') ||
                event.endsWith('.create')
              );
              
              // For updated notifications, check if it's an update event
              const isUpdateEvent = response.events?.some(event => 
                event.includes('documents.*.update') || 
                event.includes('.update') ||
                event.endsWith('.update')
              );
              
              if (isCreateEvent) {
                console.log('Badge: New notification created, isSeen:', response.payload?.isSeen);
                if (!response.payload?.isSeen) {
                  setNotificationCount(prev => {
                    console.log('Badge: Incrementing notification count from', prev, 'to', prev + 1);
                    return prev + 1;
                  });
                }
              } else if (isUpdateEvent) {
                console.log('Badge: Notification updated, refreshing count');
                setTimeout(() => fetchNotificationCount(), 500);
              } else {
                // Fallback: refresh count for any other notification event
                console.log('Badge: Other notification event, refreshing count');
                setTimeout(() => fetchNotificationCount(), 1000);
              }
            }
          },
          // onCountUpdate callback (optional)
          (payload) => {
            console.log('Badge: Notification count update:', payload);
            // This gets called with response.payload for count updates
            const receiverUserId = typeof payload?.receiverUser === 'string' 
              ? payload.receiverUser 
              : payload?.receiverUser?.$id;
              
            if (receiverUserId === user.$id && !payload?.isSeen) {
              // Alternative way to handle count updates
              fetchNotificationCount();
            }
          }
        );
      } catch (error) {
        console.error('Badge: Failed to setup notification subscription:', error);
        return () => {};
      }
    };

    const setupMessageSubscription = () => {
      try {
        return subscribeToMessages(
          user.$id,
          (response) => {
            console.log('Badge: Message realtime event:', response);
            
            // Check if this message is for the current user
            const receiverUserId = typeof response.payload?.receiverUser === 'string' 
              ? response.payload.receiverUser 
              : response.payload?.receiverUser?.$id;
              
            if (receiverUserId === user.$id) {
              console.log('Badge: Message event types:', response.events);
              
              // For new messages, check if it's a create event
              const isCreateEvent = response.events?.some(event => 
                event.includes('documents.*.create') || 
                event.includes('.create') ||
                event.endsWith('.create')
              );
              
              // For updated messages, check if it's an update event
              const isUpdateEvent = response.events?.some(event => 
                event.includes('documents.*.update') || 
                event.includes('.update') ||
                event.endsWith('.update')
              );
              
              if (isCreateEvent) {
                console.log('Badge: New message created, isSeen:', response.payload?.isSeen);
                if (!response.payload?.isSeen) {
                  setMessageCount(prev => {
                    console.log('Badge: Incrementing message count from', prev, 'to', prev + 1);
                    return prev + 1;
                  });
                }
              } else if (isUpdateEvent) {
                console.log('Badge: Message updated, refreshing count');
                setTimeout(() => fetchMessageCount(), 500);
              } else {
                // Fallback: refresh count for any other message event
                console.log('Badge: Other message event, refreshing count');
                setTimeout(() => fetchMessageCount(), 1000);
              }
            }
          }
        );
      } catch (error) {
        console.error('Badge: Failed to setup message subscription:', error);
        return () => {};
      }
    };

    // Setup subscriptions
    const unsubscribeNotifications = setupNotificationSubscription();
    const unsubscribeMessages = setupMessageSubscription();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Badge: Cleaning up realtime subscriptions');
      if (unsubscribeNotifications && typeof unsubscribeNotifications === 'function') {
        unsubscribeNotifications();
      }
      if (unsubscribeMessages && typeof unsubscribeMessages === 'function') {
        unsubscribeMessages();
      }
    };
  }, [user?.$id, isAuthenticated, fetchNotificationCount, fetchMessageCount]);

  // Function to update current screen (for hiding badges on current screen)
  const updateCurrentScreen = useCallback((screenName) => {
    setCurrentScreen(screenName);
  }, []);

  // Function to refresh all counts (useful when user performs actions)
  const refreshBadgeCounts = useCallback(() => {
    console.log('Badge: Manually refreshing badge counts');
    loadBadgeCounts();
  }, [loadBadgeCounts]);



  // Function to decrease notification count
  const decreaseNotificationCount = useCallback((amount = 1) => {
    setNotificationCount(prev => Math.max(0, prev - amount));
  }, []);

  // Function to decrease message count
  const decreaseMessageCount = useCallback((amount = 1) => {
    setMessageCount(prev => Math.max(0, prev - amount));
  }, []);

  // Function to clear notification count
  const clearNotificationCount = useCallback(() => {
    setNotificationCount(0);
  }, []);

  // Function to clear message count
  const clearMessageCount = useCallback(() => {
    setMessageCount(0);
  }, []);

  // Function to get notification badge count based on user type and current screen
  const getNotificationBadgeCount = useCallback(() => {
    if (!user) return 0;
    
    // Don't show badge on home/dashboard screen for notifications
    if ((user.type === 'client' && currentScreen === 'home') ||
        (user.type === 'artisan' && currentScreen === 'dashboard')) {
      return 0;
    }
    
    return notificationCount;
  }, [notificationCount, currentScreen, user]);

  // Function to get message badge count based on current screen
  const getMessageBadgeCount = useCallback(() => {
    // Don't show badge on messages screen
    if (currentScreen === 'messages') {
      return 0;
    }
    
    return messageCount;
  }, [messageCount, currentScreen]);

  const value = {
    // Counts
    notificationCount,
    messageCount,
    isLoading,
    
    // Screen management
    currentScreen,
    updateCurrentScreen,
    
    // Badge counts with visibility logic
    getNotificationBadgeCount,
    getMessageBadgeCount,
    
    // Actions
    refreshBadgeCounts,
    decreaseNotificationCount,
    decreaseMessageCount,
    clearNotificationCount,
    clearMessageCount,
    
    // Direct access to fetch functions
    fetchNotificationCount,
    fetchMessageCount,
  };

  return (
    <BadgeContext.Provider value={value}>
      {children}
    </BadgeContext.Provider>
  );
}; 