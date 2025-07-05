/**
 * Service pour la prédiction de prix via API
 */

const API_BASE_URL = "http://127.0.0.1:7000";

/**
 * Prédit le prix d'une tâche en utilisant l'API
 * @param {Object} data - Les données de la tâche
 * @param {string} data.titrePrestation - Le titre de la prestation
 * @param {string} data.descPrestation - La description de la prestation
 * @param {string} data.titreTache - Le titre de la tâche
 * @param {string} data.descTache - La description de la tâche
 * @returns {Promise<Object>} - Retourne un objet avec success et data/error
 */
export const predictPrice = async (data) => {
  try {
    console.log("📡 Sending prediction request to:", `${API_BASE_URL}/predict`);
    console.log("📦 Request data:", JSON.stringify(data, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        titrePrestation: data.titrePrestation,
        descPrestation: data.descPrestation,
        titreTache: data.titreTache,
        descTache: data.descTache,
      }),
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response headers:", response.headers);

    if (!response.ok) {
      let errorDetails = `HTTP error! status: ${response.status}`;
      
      try {
        const errorBody = await response.text();
        console.log("❌ Error response body:", errorBody);
        errorDetails += ` - ${errorBody}`;
      } catch (e) {
        console.log("❌ Could not read error response body");
      }
      
      throw new Error(errorDetails);
    }

    const result = await response.json();
    console.log("✅ Prediction result:", result);
    
    return {
      success: true,
      data: result,
      predictedPrice: result.predictedPrice || result.predicted_price || result.price || result.prediction || 0,
    };
  } catch (error) {
    console.error("❌ Error predicting price:", error);
    
    // Gestion spécifique des erreurs réseau
    if (error.message.includes('Network request failed')) {
      return {
        success: false,
        error: "Impossible de contacter le serveur. Vérifiez que l'API est démarrée sur localhost:8000",
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to predict price",
    };
  }
};

/**
 * Vérifie si tous les champs requis sont remplis
 * @param {Object} data - Les données à vérifier
 * @returns {boolean} - True si tous les champs sont remplis
 */
export const areFieldsComplete = (data) => {
  return !!(
    data.titrePrestation &&
    data.descPrestation &&
    data.titreTache &&
    data.descTache &&
    data.titrePrestation.trim() !== "" &&
    data.descPrestation.trim() !== "" &&
    data.titreTache.trim() !== "" &&
    data.descTache.trim() !== ""
  );
};

/**
 * Évalue la qualité du prix proposé par rapport au prix prédit par l'IA
 * @param {number} proposedPrice - Prix proposé par l'artisan
 * @param {number} predictedPrice - Prix prédit par l'IA
 * @returns {Object} - Objet contenant le label et les informations de style
 */
export const evaluatePriceQuality = (proposedPrice, predictedPrice) => {
  if (!proposedPrice || !predictedPrice || predictedPrice <= 0) {
    return {
      label: "Unknown",
      color: "#666666",
      backgroundColor: "#f5f5f5",
      percentage: 0,
    };
  }

  const difference = ((proposedPrice - predictedPrice) / predictedPrice) * 100;

  if (difference > 25) {
    return {
      label: "Very Bad",
      color: "#8b0000", // Rouge foncé
      backgroundColor: "#ffcdd2", // Rouge plus visible
      percentage: difference,
    };
  } else if (difference > 0) {
    return {
      label: "Bad",
      color: "#cc5500", // Orange foncé
      backgroundColor: "#ffcc80", // Orange plus visible
      percentage: difference,
    };
  } else if (difference >= -25) {
    return {
      label: "Good",
      color: "#1b5e20", // Vert foncé
      backgroundColor: "#c8e6c9", // Vert plus visible
      percentage: difference,
    };
  } else {
    return {
      label: "Excellent",
      color: "#1565c0", // Bleu foncé
      backgroundColor: "#bbdefb", // Bleu plus visible
      percentage: difference,
    };
  }
};

/**
 * Évalue les prix de toutes les tâches d'une application d'artisan
 * @param {Object} applicationData - Données de l'application
 * @param {string} applicationData.serviceTitle - Titre du service
 * @param {string} applicationData.serviceDescription - Description du service
 * @param {Array} applicationData.tasks - Liste des tâches avec titre, description et prix proposé
 * @returns {Promise<Object>} - Résultat avec les évaluations de prix
 */
export const evaluateApplicationPrices = async (applicationData) => {
  try {
    console.log("🔍 Evaluating application prices...");
    
    const { serviceTitle, serviceDescription, tasks } = applicationData;
    
    if (!serviceTitle || !serviceDescription || !tasks || tasks.length === 0) {
      return {
        success: false,
        error: "Missing required application data",
      };
    }

    const evaluations = [];
    
    for (const task of tasks) {
      const { title: taskTitle, description: taskDescription, proposedPrice } = task;
      
      if (!taskTitle || !taskDescription || !proposedPrice) {
        evaluations.push({
          taskTitle: taskTitle || "Unknown Task",
          taskDescription: taskDescription || "",
          proposedPrice: proposedPrice || 0,
          evaluation: {
            label: "Unknown",
            color: "#666666",
            backgroundColor: "#f5f5f5",
            percentage: 0,
          },
          predictedPrice: null,
          error: "Missing task data",
        });
        continue;
      }

      // Prédire le prix avec l'IA
      const predictionResult = await predictPrice({
        titrePrestation: serviceTitle,
        descPrestation: serviceDescription,
        titreTache: taskTitle,
        descTache: taskDescription,
      });

      if (predictionResult.success) {
        const evaluation = evaluatePriceQuality(proposedPrice, predictionResult.predictedPrice);
        
        evaluations.push({
          taskTitle,
          taskDescription,
          proposedPrice,
          predictedPrice: predictionResult.predictedPrice,
          evaluation,
        });
      } else {
        evaluations.push({
          taskTitle,
          taskDescription,
          proposedPrice,
          predictedPrice: null,
          evaluation: {
            label: "Unknown",
            color: "#666666",
            backgroundColor: "#f5f5f5",
            percentage: 0,
          },
          error: predictionResult.error,
        });
      }
    }

    return {
      success: true,
      data: {
        serviceTitle,
        serviceDescription,
        evaluations,
        summary: {
          totalTasks: tasks.length,
          excellent: evaluations.filter(e => e.evaluation.label === "Excellent").length,
          good: evaluations.filter(e => e.evaluation.label === "Good").length,
          bad: evaluations.filter(e => e.evaluation.label === "Bad").length,
          veryBad: evaluations.filter(e => e.evaluation.label === "Very Bad").length,
          unknown: evaluations.filter(e => e.evaluation.label === "Unknown").length,
        },
      },
    };
  } catch (error) {
    console.error("❌ Error evaluating application prices:", error);
    return {
      success: false,
      error: error.message || "Failed to evaluate application prices",
    };
  }
};
