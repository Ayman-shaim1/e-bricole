/**
 * Network troubleshooting utilities and diagnostic tools
 */

import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export const NETWORK_TROUBLESHOOTING_STEPS = [
  {
    title: 'Vérifier la connexion réseau',
    steps: [
      'Assurez-vous que votre appareil est connecté à Internet',
      'Vérifiez que vous avez un signal WiFi ou cellulaire',
      'Essayez de redémarrer votre connexion réseau',
    ]
  },
  {
    title: 'Vérifier les paramètres de l\'appareil',
    steps: [
      'Vérifiez que l\'application a les permissions réseau',
      'Assurez-vous que le mode avion est désactivé',
      'Vérifiez les paramètres de proxy ou VPN',
    ]
  },
  {
    title: 'Redémarrer l\'application',
    steps: [
      'Fermez complètement l\'application',
      'Redémarrez l\'application',
      'Si le problème persiste, redémarrez votre appareil',
    ]
  },
  {
    title: 'Vérifier la version de l\'application',
    steps: [
      'Assurez-vous que vous utilisez la dernière version',
      'Essayez de réinstaller l\'application',
      'Vérifiez les mises à jour système',
    ]
  }
];

export const getNetworkDiagnostics = async () => {
  const netInfo = await NetInfo.fetch();
  
  return {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    networkInfo: {
      isConnected: netInfo.isConnected,
      isInternetReachable: netInfo.isInternetReachable,
      type: netInfo.type,
      isWifi: netInfo.type === 'wifi',
      isCellular: netInfo.type === 'cellular',
      details: netInfo.details,
    },
    deviceInfo: {
      brand: Platform.constants?.Brand || 'unknown',
      model: Platform.constants?.Model || 'unknown',
      systemVersion: Platform.constants?.SystemVersion || 'unknown',
    }
  };
};

export const testSpecificEndpoints = async () => {
  const endpoints = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'HTTPBin', url: 'https://httpbin.org/get' },
    { name: 'Nominatim Status', url: 'https://nominatim.openstreetmap.org/status.php' },
    { name: 'Nominatim Search', url: 'https://nominatim.openstreetmap.org/search?q=test&format=json&limit=1' },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(endpoint.url, { 
        method: 'HEAD',
        timeout: 10000 
      });
      const endTime = Date.now();
      
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        statusText: response.statusText,
        responseTime: endTime - startTime,
        success: response.ok,
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
};

export const generateTroubleshootingReport = async () => {
  const diagnostics = await getNetworkDiagnostics();
  const endpointTests = await testSpecificEndpoints();
  
  const report = {
    ...diagnostics,
    endpointTests,
    recommendations: [],
  };

  // Generate recommendations based on test results
  if (!diagnostics.networkInfo.isConnected) {
    report.recommendations.push('Votre appareil n\'est pas connecté à un réseau. Vérifiez votre connexion WiFi ou cellulaire.');
  }

  if (!diagnostics.networkInfo.isInternetReachable) {
    report.recommendations.push('Votre appareil est connecté à un réseau mais n\'a pas accès à Internet. Vérifiez votre connexion Internet.');
  }

  const failedEndpoints = endpointTests.filter(test => !test.success);
  if (failedEndpoints.length > 0) {
    report.recommendations.push(`Certains services ne sont pas accessibles: ${failedEndpoints.map(e => e.name).join(', ')}`);
  }

  if (failedEndpoints.some(e => e.name.includes('Nominatim'))) {
    report.recommendations.push('Le service de géocodage Nominatim n\'est pas accessible. Cela peut être temporaire ou dû à des restrictions réseau.');
  }

  return report;
};

export const logNetworkReport = async () => {
  const report = await generateTroubleshootingReport();
  
  console.log('=== NETWORK TROUBLESHOOTING REPORT ===');
  console.log('Timestamp:', report.timestamp);
  console.log('Platform:', report.platform);
  console.log('Network Info:', report.networkInfo);
  console.log('Device Info:', report.deviceInfo);
  console.log('Endpoint Tests:', report.endpointTests);
  console.log('Recommendations:', report.recommendations);
  console.log('=== END REPORT ===');
  
  return report;
}; 