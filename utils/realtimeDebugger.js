/**
 * Realtime Connection Debugger
 * Utility for diagnosing and troubleshooting realtime connection issues
 */

import NetInfo from '@react-native-community/netinfo';
import { AppState, Platform } from 'react-native';
import { getConnectionStatus, forceReconnect } from '../services/realtimeService';
import { getUnseenNotificationCount } from '../services/notificationService';

// Diagnostic data collection
let diagnosticHistory = [];
const MAX_HISTORY_ENTRIES = 50;

const addDiagnosticEntry = (type, data) => {
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    data,
    appState: AppState.currentState,
    platform: Platform.OS
  };
  
  diagnosticHistory.unshift(entry);
  
  // Keep only recent entries
  if (diagnosticHistory.length > MAX_HISTORY_ENTRIES) {
    diagnosticHistory = diagnosticHistory.slice(0, MAX_HISTORY_ENTRIES);
  }
  
  return entry;
};

// Comprehensive network and realtime status check
export const runDiagnostics = async () => {
  console.log('🔍 Running Realtime Connection Diagnostics...');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    appState: AppState.currentState,
    network: null,
    realtime: null,
    recommendations: []
  };

  try {
    // 1. Network connectivity check
    console.log('📡 Checking network connectivity...');
    const netInfo = await NetInfo.fetch();
    diagnostics.network = {
      isConnected: netInfo.isConnected,
      isInternetReachable: netInfo.isInternetReachable,
      type: netInfo.type,
      details: netInfo.details,
      isWifi: netInfo.type === 'wifi',
      isCellular: netInfo.type === 'cellular',
      isEthernet: netInfo.type === 'ethernet'
    };

    if (!netInfo.isConnected) {
      diagnostics.recommendations.push('❌ Pas de connexion réseau détectée');
    } else if (netInfo.isInternetReachable === false) {
      diagnostics.recommendations.push('⚠️ Connexion réseau sans accès Internet');
    } else if (netInfo.type === 'cellular' && netInfo.details?.cellularGeneration === '2g') {
      diagnostics.recommendations.push('⚠️ Connexion 2G détectée - performances limitées');
    }

    // 2. Realtime connection status
    console.log('🔌 Checking realtime connection status...');
    const realtimeStatus = getConnectionStatus();
    diagnostics.realtime = realtimeStatus;

    if (!realtimeStatus.isConnected) {
      if (realtimeStatus.reconnectAttempts > 0) {
        diagnostics.recommendations.push(
          `🔄 Reconnexion en cours (${realtimeStatus.reconnectAttempts}/${realtimeStatus.maxReconnectAttempts})`
        );
      } else {
        diagnostics.recommendations.push('❌ Connexion temps réel inactive');
      }
    }

    if (realtimeStatus.activeSubscriptionsCount === 0) {
      diagnostics.recommendations.push('⚠️ Aucune souscription active détectée');
    }

    // 3. App state check
    if (AppState.currentState !== 'active') {
      diagnostics.recommendations.push('ℹ️ Application en arrière-plan - connexions pausées');
    }

    // 4. Platform-specific checks
    if (Platform.OS === 'ios') {
      diagnostics.recommendations.push('ℹ️ iOS: Vérifiez les permissions réseau dans Réglages');
    } else if (Platform.OS === 'android') {
      diagnostics.recommendations.push('ℹ️ Android: Vérifiez l\'économiseur de batterie');
    }

    // 5. Connection test
    console.log('🧪 Testing basic connectivity...');
    try {
      const testResponse = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        timeout: 5000
      });
      diagnostics.connectionTest = {
        success: testResponse.ok,
        status: testResponse.status,
        statusText: testResponse.statusText
      };
      
      if (!testResponse.ok) {
        diagnostics.recommendations.push('❌ Test de connectivité échoué');
      }
    } catch (error) {
      diagnostics.connectionTest = {
        success: false,
        error: error.message
      };
      diagnostics.recommendations.push('❌ Impossible de joindre les serveurs externes');
    }

    // Add final recommendations
    if (diagnostics.recommendations.length === 0) {
      diagnostics.recommendations.push('✅ Aucun problème détecté');
    } else {
      diagnostics.recommendations.push('💡 Essayez de redémarrer l\'application si les problèmes persistent');
    }

  } catch (error) {
    console.error('Error running diagnostics:', error);
    diagnostics.error = error.message;
    diagnostics.recommendations.push('❌ Erreur lors du diagnostic');
  }

  // Log comprehensive results
  console.log('📊 Diagnostic Results:', diagnostics);
  
  // Add to history
  addDiagnosticEntry('full_diagnostic', diagnostics);
  
  return diagnostics;
};

// Quick connection health check
export const quickHealthCheck = async () => {
  const netInfo = await NetInfo.fetch();
  const realtimeStatus = getConnectionStatus();
  
  const health = {
    overall: 'healthy',
    network: netInfo.isConnected && netInfo.isInternetReachable !== false,
    realtime: realtimeStatus.isConnected,
    appState: AppState.currentState === 'active'
  };

  if (!health.network) {
    health.overall = 'network_issues';
  } else if (!health.realtime) {
    health.overall = 'realtime_issues';
  } else if (!health.appState) {
    health.overall = 'background';
  }

  addDiagnosticEntry('health_check', health);
  return health;
};

// Force reconnection with diagnostics
export const diagnosticReconnect = async () => {
  console.log('🔄 Initiating diagnostic reconnection...');
  
  const preReconnectDiagnostics = await quickHealthCheck();
  addDiagnosticEntry('reconnect_attempt', { phase: 'before', ...preReconnectDiagnostics });
  
  try {
    await forceReconnect();
    
    // Wait a bit for the reconnection to take effect
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const postReconnectDiagnostics = await quickHealthCheck();
    addDiagnosticEntry('reconnect_attempt', { phase: 'after', ...postReconnectDiagnostics });
    
    return {
      success: true,
      before: preReconnectDiagnostics,
      after: postReconnectDiagnostics
    };
  } catch (error) {
    addDiagnosticEntry('reconnect_error', { error: error.message });
    return {
      success: false,
      error: error.message,
      before: preReconnectDiagnostics
    };
  }
};

// Get diagnostic history
export const getDiagnosticHistory = () => {
  return [...diagnosticHistory];
};

// Clear diagnostic history
export const clearDiagnosticHistory = () => {
  diagnosticHistory = [];
  console.log('🗑️ Diagnostic history cleared');
};

// Export summary for debugging
export const exportDiagnosticSummary = () => {
  const summary = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    appState: AppState.currentState,
    historyCount: diagnosticHistory.length,
    recentIssues: diagnosticHistory
      .filter(entry => entry.type !== 'health_check')
      .slice(0, 10),
    connectionPattern: diagnosticHistory
      .filter(entry => entry.type === 'health_check')
      .slice(0, 20)
      .map(entry => ({
        timestamp: entry.timestamp,
        overall: entry.data.overall
      }))
  };
  
  console.log('📋 Diagnostic Summary Export:', summary);
  return summary;
};

// Monitor connection and log issues automatically
let isMonitoring = false;
let monitoringInterval = null;

export const startConnectionMonitoring = (intervalMs = 30000) => {
  if (isMonitoring) {
    console.log('🔍 Connection monitoring already active');
    return;
  }
  
  isMonitoring = true;
  console.log(`🔍 Starting connection monitoring (every ${intervalMs}ms)`);
  
  monitoringInterval = setInterval(async () => {
    if (AppState.currentState === 'active') {
      const health = await quickHealthCheck();
      
      // Only log if there are issues
      if (health.overall !== 'healthy') {
        console.warn('⚠️ Connection issue detected:', health);
      }
    }
  }, intervalMs);
};

export const stopConnectionMonitoring = () => {
  if (!isMonitoring) {
    return;
  }
  
  isMonitoring = false;
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  
  console.log('🛑 Connection monitoring stopped');
};

/**
 * Debug utility for monitoring realtime notification system
 */
export class RealtimeDebugger {
  constructor() {
    this.isDebugging = __DEV__; // Only enable in development
    this.logs = [];
    this.maxLogs = 100;
  }

  log(message, data = null) {
    if (!this.isDebugging) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    console.log(`[RealtimeDebug] ${timestamp}: ${message}`, data || '');
  }

  async checkNotificationSystemHealth(userId) {
    if (!this.isDebugging) return;
    
    this.log('=== Notification System Health Check ===');
    
    try {
      // Check connection status
      const connectionStatus = getConnectionStatus();
      this.log('Connection Status', connectionStatus);
      
      // Check unseen notification count
      const unseenCount = await getUnseenNotificationCount(userId);
      this.log('Current unseen count from database', { unseenCount });
      
      // Check if realtime is working
      this.log('Realtime connection details', {
        isConnected: connectionStatus.isConnected,
        reconnectAttempts: connectionStatus.reconnectAttempts,
        activeSubscriptions: connectionStatus.activeSubscriptionsCount,
        appState: connectionStatus.appState
      });
      
      if (!connectionStatus.isConnected) {
        this.log('⚠️ WARNING: Realtime connection is not active');
      }
      
      if (connectionStatus.activeSubscriptionsCount === 0) {
        this.log('⚠️ WARNING: No active subscriptions found');
      }
      
      this.log('=== Health Check Complete ===');
      
    } catch (error) {
      this.log('❌ ERROR during health check', error);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.log('Logs cleared');
  }

  printSummary() {
    if (!this.isDebugging) return;
    
    console.log('\n=== REALTIME DEBUG SUMMARY ===');
    console.log(`Total log entries: ${this.logs.length}`);
    
    const recentLogs = this.logs.slice(0, 10);
    console.log('Recent logs:');
    recentLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.timestamp}: ${log.message}`);
    });
    
    console.log('=== END SUMMARY ===\n');
  }
}

// Create singleton instance
export const realtimeDebugger = new RealtimeDebugger();

// Export utility functions
export const debugNotificationSystem = (userId) => {
  return realtimeDebugger.checkNotificationSystemHealth(userId);
};

export const logRealtimeEvent = (message, data) => {
  realtimeDebugger.log(message, data);
};

export const getDebugLogs = () => {
  return realtimeDebugger.getLogs();
};

export const clearDebugLogs = () => {
  realtimeDebugger.clearLogs();
}; 