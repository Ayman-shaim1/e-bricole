import { databases } from "../config/appwrite";
import settings from "../config/settings";
import { Query } from "appwrite";

/**
 * Récupère les earnings d'un artisan pour une période donnée
 * @param {string} artisanId - L'ID de l'artisan
 * @param {number} periodDays - Nombre de jours pour la période (90, 120, 180, 240, 365)
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function getArtisanEarnings(artisanId, periodDays = 90) {
  try {
    // Calculate period start and end dates
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodDays);

    // Get all accepted applications for the artisan
    const applicationsResponse = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      [
        Query.equal("artisan", artisanId),
        Query.equal("status", "accepted"),
        Query.orderAsc("$createdAt"),
        Query.limit(100) // Limit to avoid performance issues
      ]
    );

    // Filter applications by period
    const filteredApplications = applicationsResponse.documents.filter(app => {
      const appDate = new Date(app.$createdAt);
      return appDate >= startDate && appDate <= endDate;
    });

    const applications = filteredApplications;
    
    // For each application, get task proposals and calculate earnings
    const earningsData = [];
    let totalEarnings = 0;

    // If no applications found, return empty but valid data
    if (applications.length === 0) {
      const monthlyData = groupEarningsByMonth([], periodDays);
      return {
        success: true,
        data: {
          totalEarnings: 0,
          monthlyData,
          applicationsCount: 0,
          rawData: [],
          period: {
            startDate,
            endDate,
            days: periodDays
          }
        },
        error: null
      };
    }

    for (const application of applications) {
      // Get task proposals for this application
      const taskProposalsResponse = await databases.listDocuments(
        settings.dataBaseId,
        settings.serviceTaskProposalsId,
        [Query.equal("serviceApplication", application.$id)]
      );

      // Calculate total earnings for this application
      const applicationEarnings = taskProposalsResponse.documents.reduce(
        (sum, proposal) => sum + parseFloat(proposal.newPrice || 0),
        0
      );

      totalEarnings += applicationEarnings;

      // Add data with creation date
      earningsData.push({
        date: new Date(application.$createdAt),
        earnings: applicationEarnings,
        applicationId: application.$id,
        serviceRequestId: application.serviceRequest
      });
    }

    // Group earnings by month for the chart
    const monthlyData = groupEarningsByMonth(earningsData, periodDays);

    return {
      success: true,
      data: {
        totalEarnings,
        monthlyData,
        applicationsCount: applications.length,
        rawData: earningsData,
        period: {
          startDate,
          endDate,
          days: periodDays
        }
      },
      error: null
    };
  } catch (error) {
    console.error("Error fetching artisan earnings:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}

/**
 * Groupe les earnings par mois pour le graphique linéaire
 * @param {Array} earningsData - Données d'earnings brutes
 * @param {number} periodDays - Nombre de jours de la période
 * @returns {Object} Données formatées pour le graphique
 */
function groupEarningsByMonth(earningsData, periodDays) {
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Créer un map pour stocker les earnings par mois
  const monthlyEarnings = new Map();
  
  // Calculer le nombre de mois à afficher selon la période
  const monthsToShow = Math.ceil(periodDays / 30);
  
  // Initialiser tous les mois de la période avec 0
  const endDate = new Date();
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const monthDate = new Date(endDate);
    monthDate.setMonth(monthDate.getMonth() - i);
    const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    const monthLabel = `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear().toString().slice(-2)}`;
    
    monthlyEarnings.set(monthKey, {
      label: monthLabel,
      earnings: 0,
      count: 0
    });
  }

  // Ajouter les earnings réels
  earningsData.forEach(({ date, earnings }) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (monthlyEarnings.has(monthKey)) {
      const monthData = monthlyEarnings.get(monthKey);
      monthData.earnings += earnings;
      monthData.count += 1;
    }
  });

  // Convertir en format pour le graphique
  const labels = [];
  const data = [];
  
  monthlyEarnings.forEach((value) => {
    labels.push(value.label);
    data.push(Math.round(value.earnings));
  });

  return {
    labels,
    datasets: [
      {
        data,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Bleu
        strokeWidth: 2
      }
    ]
  };
}

/**
 * Récupère les statistiques générales du dashboard
 * @param {string} artisanId - L'ID de l'artisan
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function getDashboardStats(artisanId) {
  try {
    // Get all applications for the artisan
    const allApplicationsResponse = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      [
        Query.equal("artisan", artisanId),
        Query.orderDesc("$createdAt")
      ]
    );

    const applications = allApplicationsResponse.documents;
    
    // Calculate statistics
    const totalApplications = applications.length;
    const acceptedApplications = applications.filter(app => app.status === "accepted").length;
    const pendingApplications = applications.filter(app => app.status === "pending").length;
    const completedApplications = applications.filter(app => app.status === "accepted").length; // Approximation

    // Calculate total earnings from all accepted applications
    let totalEarnings = 0;
    const acceptedApps = applications.filter(app => app.status === "accepted");
    
    for (const application of acceptedApps) {
      try {
        const taskProposalsResponse = await databases.listDocuments(
          settings.dataBaseId,
          settings.serviceTaskProposalsId,
          [Query.equal("serviceApplication", application.$id)]
        );

        const applicationEarnings = taskProposalsResponse.documents.reduce(
          (sum, proposal) => sum + parseFloat(proposal.newPrice || 0),
          0
        );

        totalEarnings += applicationEarnings;
      } catch (error) {
        // Continue if there's an error with one application
        console.warn("Error calculating earnings for application:", application.$id);
      }
    }

    return {
      success: true,
      data: {
        totalApplications,
        acceptedApplications,
        pendingApplications,
        completedApplications,
        totalEarnings,
        acceptanceRate: totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0
      },
      error: null
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}

/**
 * Available periods for filters
 */
export const DASHBOARD_PERIODS = {
  DAYS_90: { value: 90, label: "90D" },
  MONTHS_4: { value: 120, label: "4M" },
  MONTHS_6: { value: 180, label: "6M" }
};
