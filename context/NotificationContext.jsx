import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUnseenNotificationCount } from '../services/notificationService';

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

  // Load initial count when user logs in
  useEffect(() => {
    if (!user?.$id) {
      setUnseenCount(0);
      return;
    }

    getUnseenNotificationCount(user.$id).then(setUnseenCount);
  }, [user?.$id]);



  const value = {
    unseenCount,
    setUnseenCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 