import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import StyledText from './StyledText';
import { colors } from '../constants/colors';
import { useApiHealth } from '../hooks/useApiHealth';
import { useNotifications } from '../context/NotificationContext';

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
        details: `Tentatives de reconnexion: ${connectionStatus.reconnectAttempts || 0}/${connectionStatus.maxReconnectAttempts || 5}`
      };
    }
    
    // Add app state info if available
    if (connectionStatus.appState === 'background') {
      return {
        status: 'background',
        message: 'App en arrière-plan',
        severity: 'info',
        details: 'Les notifications en temps réel sont pausées'
      };
    }
    
    // Add network type info for poor connections
    if (connectionStatus.lastNetworkState?.type === 'cellular' && 
        connectionStatus.lastNetworkState?.isInternetReachable === false) {
      return {
        status: 'poor_connection',
        message: 'Connexion réseau limitée',
        severity: 'warning',
        details: 'Certaines fonctionnalités peuvent être ralenties'
      };
    }
    
    return healthStatus;
  };

  const enhancedStatus = getEnhancedStatus();
  
  // Don't show anything if everything is healthy and showOnlyWhenIssues is true
  if (showOnlyWhenIssues && (!enhancedStatus || enhancedStatus.status === 'healthy')) {
    return null;
  }

  const getStatusColor = () => {
    if (!enhancedStatus) return colors.primary;
    
    switch (enhancedStatus.severity) {
      case 'error':
        return colors.danger || '#ff4444';
      case 'warning':
        return colors.warning || '#ffaa00';
      case 'info':
        return colors.info || '#3498db';
      case 'success':
        return colors.success || '#00aa00';
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = () => {
    if (!enhancedStatus) return '❓';
    
    switch (enhancedStatus.status) {
      case 'offline':
        return '📡';
      case 'realtime_disconnected':
      case 'realtime_issues':
        return '🔌';
      case 'poor_connection':
        return '📶';
      case 'background':
        return '⏸️';
      case 'healthy':
        return '✅';
      default:
        return '❓';
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(enhancedStatus);
    } else {
      console.log('Connection Status Details:', {
        enhancedStatus,
        connectionStatus,
        timestamp: new Date().toISOString()
      });
    }
  };

  const content = (
    <View style={[styles.container, { backgroundColor: getStatusColor() + '20' }]}>
      <StyledText 
        text={`${getStatusIcon()} ${enhancedStatus?.message || 'État inconnu'}`}
        style={[styles.text, { color: getStatusColor() }]}
      />
      {enhancedStatus?.details && (
        <StyledText 
          text={enhancedStatus.details}
          style={[styles.details, { color: getStatusColor() }]}
        />
      )}
    </View>
  );

  if (onPress || enhancedStatus?.severity === 'error') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    marginHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  details: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.8,
  },
});

export default ApiStatusIndicator; 