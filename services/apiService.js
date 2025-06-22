import settings from "../config/settings";

/**
 * Service centralisé pour gérer les appels API avec retry et fallback
 */
class ApiService {
  /**
   * Effectue un appel API avec retry automatique
   * @param {string} url - URL de l'API
   * @param {Object} options - Options de fetch
   * @param {number} maxRetries - Nombre maximum de tentatives
   * @returns {Promise<Response>}
   */
  static async fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Utiliser AbortController pour le timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Si la réponse est OK, on la retourne
        if (response.ok) {
          return response;
        }
        
        // Pour les erreurs de serveur, on retry
        if ((response.status === 502 || response.status === 503 || response.status === 504) && attempt < maxRetries) {
          console.log(`Tentative ${attempt + 1}/${maxRetries + 1} échouée avec le statut ${response.status}`);
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
          continue;
        }
        
        // Pour les autres erreurs, on ne retry pas
        return response;
        
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          console.log(`Tentative ${attempt + 1}/${maxRetries + 1} échouée:`, error.message);
          await this.delay(1000 * (attempt + 1));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Délai en millisecondes
   * @param {number} ms - Millisecondes à attendre
   * @returns {Promise}
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Vérifie si l'API OpenRouteService est disponible
   * @returns {Promise<boolean>}
   */
  static async checkOpenRouteServiceHealth() {
    try {
      const response = await this.fetchWithRetry(
        `https://api.openrouteservice.org/geocode/search?api_key=${settings.openRouteApiKey}&text=test&size=1`,
        { timeout: 5000 }
      );
      return response.ok;
    } catch (error) {
      console.error("OpenRouteService health check failed:", error.message);
      return false;
    }
  }

  /**
   * Obtient une nouvelle clé API OpenRouteService si nécessaire
   * @returns {Promise<string|null>}
   */
  static async getNewApiKey() {
    // Ici vous pourriez implémenter une logique pour obtenir une nouvelle clé API
    // Par exemple, depuis votre serveur ou un service de rotation de clés
    console.log("Demande d'une nouvelle clé API OpenRouteService...");
    return null;
  }
}

export default ApiService; 