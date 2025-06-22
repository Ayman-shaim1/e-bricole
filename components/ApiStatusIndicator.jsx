import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledLabel from './StyledLabel';
import StyledCard from './StyledCard';
import { colors } from '../constants/colors';
import useApiHealth from '../hooks/useApiHealth';

export default function ApiStatusIndicator() {
  const { openRouteHealth, nominatimHealth, loading, error } = useApiHealth();

  if (loading) {
    return (
      <StyledCard style={styles.container}>
        <StyledLabel text="Vérification des APIs..." color="primary" />
      </StyledCard>
    );
  }

  if (error) {
    return (
      <StyledCard style={styles.container}>
        <StyledLabel text={`Erreur de vérification: ${error}`} color="danger" />
      </StyledCard>
    );
  }

  return (
    <StyledCard style={styles.container}>
      <StyledLabel text="État des APIs:" style={styles.title} />
      
      <View style={styles.apiStatus}>
        <View style={styles.apiItem}>
          <StyledLabel text="Nominatim (actuel):" style={styles.apiName} />
          <View style={[
            styles.statusDot, 
            { backgroundColor: nominatimHealth?.status === 'healthy' ? colors.success : colors.danger }
          ]} />
          <StyledLabel 
            text={nominatimHealth?.message || 'Inconnu'} 
            color={nominatimHealth?.status === 'healthy' ? 'success' : 'danger'}
            style={styles.statusText}
          />
        </View>
        
        <View style={styles.apiItem}>
          <StyledLabel text="OpenRouteService (désactivé):" style={styles.apiName} />
          <View style={[
            styles.statusDot, 
            { backgroundColor: colors.gray }
          ]} />
          <StyledLabel 
            text="API temporairement indisponible" 
            color="gray"
            style={styles.statusText}
          />
        </View>
      </View>
      
      <StyledLabel 
        text="ℹ️ Utilisation de Nominatim (OpenStreetMap) pour la géolocalisation" 
        color="primary" 
        style={styles.info}
      />
      
      {nominatimHealth?.status === 'error' && (
        <StyledLabel 
          text="❌ L'API de géolocalisation est actuellement indisponible" 
          color="danger" 
          style={styles.warning}
        />
      )}
    </StyledCard>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  apiStatus: {
    gap: 8,
  },
  apiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apiName: {
    flex: 1,
    fontSize: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    flex: 2,
  },
  info: {
    marginTop: 10,
    fontSize: 12,
    fontStyle: 'italic',
  },
  warning: {
    marginTop: 10,
    fontSize: 12,
    fontStyle: 'italic',
  },
}); 