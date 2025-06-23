import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from './StyledText';
import { colors } from '../constants/colors';
import { useApiHealth } from '../hooks/useApiHealth';

const ApiStatusIndicator = ({ showOnlyWhenIssues = true }) => {
  const { getHealthStatus } = useApiHealth();
  const healthStatus = getHealthStatus();

  // Don't show anything if everything is healthy and showOnlyWhenIssues is true
  if (showOnlyWhenIssues && healthStatus.status === 'healthy') {
    return null;
  }

  const getStatusColor = () => {
    switch (healthStatus.severity) {
      case 'error':
        return colors.error || '#ff4444';
      case 'warning':
        return colors.warning || '#ffaa00';
      case 'success':
        return colors.success || '#00aa00';
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = () => {
    switch (healthStatus.status) {
      case 'offline':
        return '📡';
      case 'realtime_disconnected':
        return '🔌';
      case 'healthy':
        return '✅';
      default:
        return '❓';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() + '20' }]}>
      <StyledText 
        text={`${getStatusIcon()} ${healthStatus.message}`}
        style={[styles.text, { color: getStatusColor() }]}
      />
    </View>
  );
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
});

export default ApiStatusIndicator; 