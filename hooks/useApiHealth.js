import { useState, useEffect } from 'react';
import settings from '../config/settings';

/**
 * Hook pour vérifier la santé des APIs utilisées dans l'application
 * @returns {Object} { openRouteHealth, nominatimHealth, loading, error }
 */
const useApiHealth = () => {
  const [openRouteHealth, setOpenRouteHealth] = useState(null);
  const [nominatimHealth, setNominatimHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkApis = async () => {
      try {
        setLoading(true);
        setError(null);

        // Vérifier Nominatim (maintenant l'API principale)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(
            'https://nominatim.openstreetmap.org/search?format=json&q=test&limit=1',
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'E-Bricole-App/1.0',
              },
              signal: controller.signal,
            }
          );
          
          clearTimeout(timeoutId);
          
          setNominatimHealth({
            status: response.ok ? 'healthy' : 'error',
            statusCode: response.status,
            message: response.ok ? 'API fonctionnelle' : `Erreur ${response.status}`,
          });
        } catch (err) {
          setNominatimHealth({
            status: 'error',
            statusCode: null,
            message: err.message,
          });
        }

        // Marquer OpenRouteService comme indisponible
        setOpenRouteHealth({
          status: 'error',
          statusCode: 502,
          message: 'API indisponible (502 Bad Gateway)',
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkApis();
  }, []);

  return {
    openRouteHealth,
    nominatimHealth,
    loading,
    error,
  };
};

export default useApiHealth; 