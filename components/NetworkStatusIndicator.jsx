import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '../constants/colors';
import { runNetworkTests } from '../utils/networkTest';

export default function NetworkStatusIndicator() {
  const [networkStatus, setNetworkStatus] = useState({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial check
    checkNetworkStatus();

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
      
      // Show indicator if there are connectivity issues
      if (!state.isConnected || !state.isInternetReachable) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkNetworkStatus = async () => {
    const state = await NetInfo.fetch();
    setNetworkStatus({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    });
  };

  const handleTestNetwork = async () => {
    try {
      await runNetworkTests();
      Alert.alert(
        'Test de réseau',
        'Les tests de réseau ont été exécutés. Vérifiez la console pour les résultats détaillés.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du test de réseau: ' + error.message);
    }
  };

  if (!isVisible) {
    return null;
  }

  const getStatusColor = () => {
    if (!networkStatus.isConnected) return colors.danger;
    if (!networkStatus.isInternetReachable) return colors.warning;
    return colors.success;
  };

  const getStatusText = () => {
    if (!networkStatus.isConnected) return 'Pas de connexion réseau';
    if (!networkStatus.isInternetReachable) return 'Pas d\'accès Internet';
    return 'Problème de connectivité';
  };

  const getStatusIcon = () => {
    if (!networkStatus.isConnected) return 'wifi-outline';
    if (!networkStatus.isInternetReachable) return 'cloud-offline-outline';
    return 'warning-outline';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]}>
        <Ionicons name={getStatusIcon()} size={16} color={colors.white} />
        <Text style={styles.text}>{getStatusText()}</Text>
        <TouchableOpacity onPress={handleTestNetwork} style={styles.testButton}>
          <Ionicons name="bug-outline" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  testButton: {
    padding: 4,
  },
}); 