import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import StyledText from './StyledText';
import { colors } from '../constants/colors';
import { useApiHealth } from '../hooks/useApiHealth';
import { useNotifications } from '../context/NotificationContext';
import { forceReconnect } from '../services/realtimeService';

const ApiStatusIndicator = ({ showOnlyWhenIssues = true, onPress = null }) => {
  const { getHealthStatus } = useApiHealth();
  const { connectionStatus } = useNotifications();
  const healthStatus = getHealthStatus();

  // Enhanced status check that includes realtime connection info
  const getEnhancedStatus = () => {
    if (!healthStatus) return null;
    
    // Check if we have network but realtime is disconnected
    if (healthStatus.status === 'healthy' && !connectionStatus.isConnected) {
      return {
        status: 'realtime_issues',
        message: 'Notifications en temps réel interrompues',
        severity: 'warning',
        details: `Tentatives de reconnexion: ${connectionStatus.reconnectAttempts || 0}/${connectionStatus.maxReconnectAttempts || 3}`,
        canRetry: true
      };
    }
    
    // Check if we're in full disconnect mode
    if (connectionStatus.isFullyDisconnected) {
      return {
        status: 'fully_disconnected',
        message: 'Reconnexion en cours...',
        severity: 'warning',
        details: 'Redémarrage après réveil du système',
        canRetry: false
      };
    }
    
    // Add app state info if available
    if (connectionStatus.appState === 'background') {
      return {
        status: 'background',
        message: 'App en arrière-plan',
        severity: 'info',
        details: 'Les notifications en temps réel sont pausées',
        canRetry: false
      };
    }
    
    // Add network type info for poor connections
    if (connectionStatus.lastNetworkState?.type === 'cellular' && 
        connectionStatus.lastNetworkState?.isInternetReachable === false) {
      return {
        status: 'poor_connection',
        message: 'Connexion réseau limitée',
        severity: 'warning',
        details: 'Certaines fonctionnalités peuvent être ralenties',
        canRetry: true
      };
    }
    
    // Check if we're actively reconnecting
    if (connectionStatus.isReconnectInProgress) {
      return {
        status: 'reconnecting',
        message: 'Reconnexion en cours...',
        severity: 'info',
        details: `Tentative ${connectionStatus.reconnectAttempts || 0}/${connectionStatus.maxReconnectAttempts || 3}`,
        canRetry: false
      };
    }
    
    return healthStatus;
  };

  const enhancedStatus = getEnhancedStatus();
  
  // Don't show anything if everything is healthy and showOnlyWhenIssues is true
  if (!enhancedStatus || (enhancedStatus.status === 'healthy' && showOnlyWhenIssues)) {
    return null;
  }

  const getStatusColor = () => {
    switch (enhancedStatus.severity) {
      case 'error':
        return colors.red;
      case 'warning':
        return colors.orange;
      case 'info':
        return colors.blue;
      default:
        return colors.green;
    }
  };

  const handlePress = async () => {
    if (onPress) {
      onPress(enhancedStatus);
      return;
    }
    
    // Default action: try to reconnect if possible
    if (enhancedStatus.canRetry) {
      try {
        console.log('Manual reconnect triggered from status indicator');
        await forceReconnect();
      } catch (error) {
        console.error('Error during manual reconnect:', error);
      }
    }
  };

  const isClickable = enhancedStatus.canRetry || onPress;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: getStatusColor(),
          opacity: isClickable ? 1 : 0.8
        }
      ]}
      onPress={isClickable ? handlePress : undefined}
      disabled={!isClickable}
      activeOpacity={isClickable ? 0.7 : 1}
    >
      <View style={styles.content}>
        <StyledText style={styles.message} numberOfLines={1}>
          {enhancedStatus.message}
        </StyledText>
        {enhancedStatus.details && (
          <StyledText style={styles.details} numberOfLines={1}>
            {enhancedStatus.details}
          </StyledText>
        )}
        {enhancedStatus.canRetry && (
          <StyledText style={styles.retryText}>
            Toucher pour reconnecter
          </StyledText>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  content: {
    alignItems: 'center',
  },
  message: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  details: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
    opacity: 0.9,
  },
  retryText: {
    color: 'white',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic',
  },
});

export default ApiStatusIndicator; 