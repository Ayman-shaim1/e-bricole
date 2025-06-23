import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getConnectionStatus } from '../services/realtimeService';

/**
 * Hook pour vérifier la santé des APIs utilisées dans l'application
 * @returns {Object} { isOnline, connectionType, realtimeStatus, getHealthStatus }
 */
export const useApiHealth = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState({ isConnected: false });

  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const netInfo = await NetInfo.fetch();
        setIsOnline(netInfo.isConnected);
        setConnectionType(netInfo.type);
      } catch (error) {
        console.error('Error checking network status:', error);
        setIsOnline(false);
      }
    };

    // Check initial network status
    checkNetworkStatus();

    // Set up network status listener
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      setConnectionType(state.type);
      
      if (!state.isConnected) {
        console.warn('Network connection lost');
      } else {
        console.log('Network connection restored');
      }
    });

    // Check realtime status periodically
    const realtimeInterval = setInterval(() => {
      setRealtimeStatus(getConnectionStatus());
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(realtimeInterval);
    };
  }, []);

  const getHealthStatus = () => {
    if (!isOnline) {
      return {
        status: 'offline',
        message: 'No internet connection',
        severity: 'error'
      };
    }

    if (!realtimeStatus.isConnected) {
      return {
        status: 'realtime_disconnected',
        message: 'Realtime connection issues',
        severity: 'warning'
      };
    }

    return {
      status: 'healthy',
      message: 'All systems operational',
      severity: 'success'
    };
  };

  return {
    isOnline,
    connectionType,
    realtimeStatus,
    getHealthStatus
  };
}; 