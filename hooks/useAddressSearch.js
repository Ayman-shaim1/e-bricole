import { useState, useCallback, useRef } from "react";
import settings from "../config/settings";
import { searchAddressWithFallback } from "../utils/networkUtils";

/**
 * Hook pour rechercher des adresses avec autocomplétion en utilisant Nominatim
 * @returns {Object} { suggestions, loading, error, searchAddresses, clearSuggestions }
 */
const useAddressSearch = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs pour gérer la cancellation et le debouncing
  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const searchAddresses = useCallback(async (query, retryCount = 0) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
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

    // Debounce de 300ms pour éviter les appels trop fréquents
    return new Promise((resolve, reject) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        setLoading(true);
        setError(null);

        try {
          console.log(`Recherche d'adresse (tentative ${retryCount + 1}):`, query);
          
          const results = await searchAddressWithFallback(query);
          
          console.log('Recherche d\'adresse réussie:', results.length, 'résultats');
          setSuggestions(results);
          resolve(results);
          
        } catch (err) {
          // Ne pas afficher l'erreur si c'est une cancellation volontaire
          if (err.name === 'AbortError') {
            console.log('Recherche d\'adresse annulée');
            resolve([]);
            return;
          }
          
          console.error("Erreur de recherche d'adresses:", err.message, err);
          
          // Retry logic for network errors (max 2 retries)
          if (retryCount < 2 && (err.message.includes('Network request failed') || err.message.includes('fetch'))) {
            console.log(`Nouvelle tentative de recherche dans 1 seconde... (${retryCount + 1}/2)`);
            setTimeout(() => {
              searchAddresses(query, retryCount + 1).then(resolve).catch(reject);
            }, 1000);
            return;
          }
          
          setError(err);
          setSuggestions([]);
          reject(err);
        } finally {
          setLoading(false);
        }
      }, 300); // Debounce de 300ms
    });
  }, []);

  const clearSuggestions = useCallback(() => {
    // Annuler la requête en cours si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Annuler le timeout de debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    setSuggestions([]);
    setLoading(false);
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    searchAddresses,
    clearSuggestions,
  };
};

export default useAddressSearch;
