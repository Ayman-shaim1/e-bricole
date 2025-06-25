import { useState, useCallback, useRef } from 'react';
import settings from '../config/settings';
import { geocodeWithFallback } from '../utils/networkUtils';

/**
 * Hook pour récupérer l'adresse à partir des coordonnées GPS en utilisant Nominatim
 * @returns {Object} { data, loading, error, reverseGeocode }
 */
const useReverseGeocode = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs pour gérer la cancellation et le debouncing
  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const reverseGeocode = useCallback(async (lat, lon, retryCount = 0) => {
    if (!lat || !lon) {
      setError(new Error('Latitude et longitude sont requises'));
      return null;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Annuler le timeout de debounce précédent
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController();

    // Debounce de 500ms pour éviter les appels trop fréquents lors du déplacement de la carte
    return new Promise((resolve, reject) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        setLoading(true);
        setError(null);
        
        try {
          console.log(`Tentative de géocodage inverse (tentative ${retryCount + 1}):`, { lat, lon });
          
          const result = await geocodeWithFallback(lat, lon);
          
          console.log('Géocodage inverse réussi:', result);
          setData(result);
          resolve(result);
          
        } catch (err) {
          // Ne pas afficher l'erreur si c'est une cancellation volontaire
          if (err.name === 'AbortError') {
            console.log('Géocodage inverse annulé');
            resolve(null);
            return;
          }
          
          console.error("Erreur de géocodage inverse:", err.message, err);
          
          // Retry logic for network errors (max 2 retries)
          if (retryCount < 2 && (err.message.includes('Network request failed') || err.message.includes('fetch'))) {
            console.log(`Nouvelle tentative dans 1 seconde... (${retryCount + 1}/2)`);
            setTimeout(() => {
              reverseGeocode(lat, lon, retryCount + 1).then(resolve).catch(reject);
            }, 1000);
            return;
          }
          
          setError(err);
          reject(err);
        } finally {
          setLoading(false);
        }
      }, 500); // Debounce de 500ms pour le géocodage inverse
    });
  }, []);

  // Fonction pour nettoyer les requêtes en cours
  const clearRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    reverseGeocode,
    clearRequests,
  };
};

export default useReverseGeocode;
