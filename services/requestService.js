import { databases } from "../config/appwrite";
import { ID, Query } from "react-native-appwrite";
import settings from "../config/settings";
import { uploadFile } from "./uploadService";
import { createNotification } from "./notificationService";

/**
 * Creates a new address document in the addresses collection
 * @param {Object} addressData - The address data containing coordinates and text address
 * @returns {Promise<{success: boolean, addressId: string|null, error: string|null}>}
 */
export async function createAddress(addressData) {
  try {
    const addressDoc = {
      latitude: addressData.coordinates.latitude,
      longitude: addressData.coordinates.longitude,
      textAddress: addressData.textAddress || "",
    };

    const response = await databases.createDocument(
      settings.dataBaseId,
      settings.addrressessId,
      ID.unique(),
      addressDoc
    );

    return {
      success: true,
      addressId: response.$id,
      error: null,
    };
  } catch (error) {
    console.error("Error creating address:", error);
    return {
      success: false,
      addressId: null,
      error: error.message,
    };
  }
}

/**
 * Creates multiple service tasks in the serviceTasks collection
 * @param {Array} tasks - Array of task objects containing title, description, and price
 * @returns {Promise<{success: boolean, taskIds: Array<string>, error: string|null}>}
 */
export async function createServiceTasks(tasks) {
  try {
    const taskPromises = tasks.map((task) => {
      const taskDoc = {
        title: task.title,
        description: task.description,
        price: parseFloat(task.price.toString().replace(",", ".")),
        status: "pending",
      };

      return databases.createDocument(
        settings.dataBaseId,
        settings.serviceTasksId,
        ID.unique(),
        taskDoc
      );
    });

    const responses = await Promise.all(taskPromises);
    const taskIds = responses.map((response) => response.$id);

    return {
      success: true,
      taskIds,
      error: null,
    };
  } catch (error) {
    console.error("Error creating service tasks:", error);
    return {
      success: false,
      taskIds: [],
      error: error.message,
    };
  }
}

/**
 * Uploads multiple images in parallel
 * @param {Array} images - Array of image URIs to upload
 * @returns {Promise<{success: boolean, uploadedImages: Array<string>, error: string|null}>}
 */
async function uploadImages(images) {
  try {
    if (!images || images.length === 0) {
      return {
        success: true,
        uploadedImages: [],
        error: null,
      };
    }

    const uploadPromises = images.map((imageUri) => uploadFile(imageUri));
    const results = await Promise.all(uploadPromises);

    // Ne garder que les URLs des images uploadées avec succès
    const uploadedImages = results
      .filter((result) => result.success)
      .map((result) => result.fileUrl);

    return {
      success: true,
      uploadedImages,
      error: null,
    };
  } catch (error) {
    console.error("Error uploading images:", error);
    return {
      success: false,
      uploadedImages: [],
      error: error.message,
    };
  }
}

/**
 * Creates a new service request with tasks, coordinates, and service type
 * @param {Object} requestData - The complete request data
 * @returns {Promise<{success: boolean, requestId: string|null, error: string|null}>}
 */
export async function createServiceRequest(requestData) {
  let uploadedImages = [];
  let createdTaskIds = [];

  try {
    // First, upload all images
    if (requestData.images && requestData.images.length > 0) {
      const imagesResult = await uploadImages(requestData.images);
      if (!imagesResult.success) {
        throw new Error(`Failed to upload images: ${imagesResult.error}`);
      }
      uploadedImages = imagesResult.uploadedImages;
    }

    // Then, create all service tasks
    if (requestData.tasks && requestData.tasks.length > 0) {
      const tasksResult = await createServiceTasks(requestData.tasks);
      if (!tasksResult.success) {
        throw new Error(`Failed to create tasks: ${tasksResult.error}`);
      }
      createdTaskIds = tasksResult.taskIds;
    }

    // Get the text address from the address object
    const textAddress =
      requestData.address?.textAddress ||
      requestData.address?.address ||
      requestData.address?.formattedAddress ||
      "";

    // Finally, create the service request
    const requestDoc = {
      title: requestData.title,
      description: requestData.description,
      duration: requestData.duration,
      totalPrice: parseFloat(
        requestData.totalPrice.toString().replace(",", ".")
      ),
      images: uploadedImages,
      latitude: requestData.address.coordinates.latitude,
      longitude: requestData.address.coordinates.longitude,
      textAddress: textAddress,
      serviceTasks: createdTaskIds,
      serviceType: requestData.serviceType,
      status: "in progress",
      user: requestData.user,
    };

    const response = await databases.createDocument(
      settings.dataBaseId,
      settings.serviceRequestsId,
      ID.unique(),
      requestDoc
    );

    return {
      success: true,
      requestId: response.$id,
      error: null,
    };
  } catch (error) {
    console.error("Error creating service request:", error);

    // If there was an error, we should clean up any created resources
    try {
      // Delete any uploaded images
      if (uploadedImages.length > 0) {
        // TODO: Implement image deletion from storage
      }

      // Delete any created tasks
      if (createdTaskIds.length > 0) {
        // TODO: Implement task deletion
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }

    return {
      success: false,
      requestId: null,
      error: error.message,
    };
  }
}

/**
 * Gets all requests for the current user
 * @returns {Promise<Array>}
 */
export async function getUserRequests() {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceRequestsId
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return [];
  }
}

/**
 * Gets a specific request by ID
 * @param {string} requestId - The ID of the request to fetch
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function getRequestById(requestId) {
  try {
    const response = await databases.getDocument(
      settings.dataBaseId,
      settings.serviceRequestsId,
      requestId
    );
    return {
      success: true,
      data: response,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching request:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

/**
 * Gets all service requests for a specific user
 * @param {string} userId - The ID of the logged-in user
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getAllRequests(userId) {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceRequestsId,
      [
        Query.equal("user", userId),
        Query.orderDesc("$createdAt")
      ]
    );
    return {
      success: true,
      data: response.documents,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching all requests:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Gets jobs filtered by location and service type within a bounding box
 * @param {Object} location - The artisan's current location {latitude, longitude}
 * @param {string} serviceType - The service type title
 * @param {number} maxDistance - Maximum distance in kilometers (default: 50)
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getJobsByLocationAndType(
  location,
  serviceType,
  maxDistance = 3
) {
  try {
    const lat = location.latitude;
    const lon = location.longitude;

    const latRad = (lat * Math.PI) / 180;
    const cosLat = Math.max(Math.cos(latRad), 0.00001);
    const latDelta = maxDistance / 111;
    const lonDelta = maxDistance / (111 * cosLat);

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceRequestsId,
      [
        Query.equal("status", "in progress"),
        Query.equal("serviceType", serviceType),
        Query.greaterThanEqual("latitude", minLat),
        Query.lessThanEqual("latitude", maxLat),
        Query.greaterThanEqual("longitude", minLon),
        Query.lessThanEqual("longitude", maxLon),
      ]
    );

    // ❗ On applique un vrai filtre de distance ensuite
    const filtered = response.documents.filter((doc) => {
      const d = getDistanceKm(lat, lon, doc.latitude, doc.longitude);
      return d <= maxDistance;
    });

    return {
      success: true,
      data: filtered,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

/**
 * Soumet une candidature d'artisan avec propositions de tâches (transaction complète)
 * @param {Object} data - { newDuration, startDate, message, serviceRequestId, artisanId, clientId, tasks: [{taskId, newPrice}] }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitServiceApplicationWithProposals(data) {
  let applicationId = null;
  let createdTaskProposalIds = [];
  let notificationId = null;
  try {
    // Format the startDate properly
    let formattedStartDate;
    if (data.startDate instanceof Date) {
      formattedStartDate = data.startDate.toISOString();
    } else if (typeof data.startDate === "string") {
      formattedStartDate = new Date(data.startDate).toISOString();
    } else {
      throw new Error("Invalid startDate format");
    }
    const clientId =
      typeof data.clientId === "object" && data.clientId.$id
        ? data.clientId.$id
        : data.clientId;
    const newDuration = parseInt(data.newDuration, 10);
    // 1. Créer la candidature principale
    const appRes = await databases.createDocument(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      ID.unique(),
      {
        message: data.message,
        startDate: formattedStartDate,
        status: "pending",
        newDuration: newDuration,
        serviceRequest: data.serviceRequestId,
        artisan: data.artisanId,
        client: clientId,
      }
    );
    applicationId = appRes.$id;
    // 2. Créer les propositions de tâches une par une pour éviter les problèmes de concurrence
    for (const task of data.tasks) {
      const taskRes = await databases.createDocument(
        settings.dataBaseId,
        settings.serviceTaskProposalsId,
        ID.unique(),
        {
          newPrice: parseFloat(task.newPrice.toString().replace(",", ".")),
          serviceTask: task.taskId,
          serviceApplication: applicationId,
        }
      );
      createdTaskProposalIds.push(taskRes.$id);
    }
    // 3. Créer la notification pour le client
    // Fetch the service request to get its title and createdAt
    const serviceRequest = await databases.getDocument(
      settings.dataBaseId,
      settings.serviceRequestsId,
      data.serviceRequestId
    );
    const requestTitle = serviceRequest.title;
    const createdAt = new Date(serviceRequest.$createdAt);
    const pad = (n) => n.toString().padStart(2, "0");
    const formattedDate = `${pad(createdAt.getDate())}/${pad(
      createdAt.getMonth() + 1
    )}/${createdAt.getFullYear()} at ${pad(createdAt.getHours())}:${pad(
      createdAt.getMinutes()
    )}`;
    const notifRes = await createNotification({
      senderUser: data.artisanId,
      receiverUser: clientId,
      title: "New Application Received",
      messageContent: `You have received a new application for your service request ("${requestTitle}") that you made here at ${formattedDate}. Please review the details and respond to the applicant if you are interested.`,
    });
    if (!notifRes.success) throw new Error(notifRes.error);
    notificationId = notifRes.notificationId;
    return { success: true };
  } catch (error) {
    // Rollback: delete everything created
    if (notificationId) {
      try {
        await databases.deleteDocument(
          settings.dataBaseId,
          settings.notificationsId,
          notificationId
        );
      } catch {}
    }
    for (const taskId of createdTaskProposalIds) {
      try {
        await databases.deleteDocument(
          settings.dataBaseId,
          settings.serviceTaskProposalsId,
          taskId
        );
      } catch {}
    }
    if (applicationId) {
      try {
        await databases.deleteDocument(
          settings.dataBaseId,
          settings.serviceApplicationsId,
          applicationId
        );
      } catch {}
    }
    return { success: false, error: error.message };
  }
}

/**
 * Checks if the artisan has already applied to a specific service request
 * @param {string} serviceRequestId
 * @param {string} artisanId
 * @returns {Promise<boolean>}
 */
export async function hasUserAppliedToRequest(serviceRequestId, artisanId) {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      [
        Query.equal("serviceRequest", serviceRequestId),
        Query.equal("artisan", artisanId)
      ]
    );
    return response.documents.length > 0;
  } catch (error) {
    return false; // fallback: allow apply if error
  }
}
