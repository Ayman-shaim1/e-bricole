import { databases } from "../config/appwrite";
import { ID } from "appwrite";
import settings from "../config/settings";
import { uploadFile } from "./uploadService";
import { Query } from "appwrite";

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
 * Creates a new service request with references to address, tasks, and service type
 * @param {Object} requestData - The complete request data
 * @returns {Promise<{success: boolean, requestId: string|null, error: string|null}>}
 */
export async function createServiceRequest(requestData) {
  try {
    // Execute all creation operations in parallel
    const [addressResult, tasksResult, imagesResult] = await Promise.all([
      createAddress(requestData.address),
      createServiceTasks(requestData.tasks),
      uploadImages(requestData.images),
    ]);

    // Check for errors in parallel operations
    if (!addressResult.success) {
      throw new Error(`Failed to create address: ${addressResult.error}`);
    }
    if (!tasksResult.success) {
      throw new Error(`Failed to create tasks: ${tasksResult.error}`);
    }
    if (!imagesResult.success) {
      throw new Error(`Failed to upload images: ${imagesResult.error}`);
    }

    // Prepare the service request document
    const requestDoc = {
      title: requestData.title,
      description: requestData.description,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      totalPrice: parseFloat(
        requestData.totalPrice.toString().replace(",", ".")
      ),
      images: imagesResult.uploadedImages,
      address: addressResult.addressId,
      serviceTasks: tasksResult.taskIds,
      serviceType: requestData.serviceType,
      status: "in progress",
      user: requestData.user,
    };

    // Create the service request document
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
      [Query.equal("user", userId), Query.orderDesc("$createdAt")]
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

/**
 * Gets jobs filtered by location and service type
 * @param {Object} location - The artisan's current location {latitude, longitude}
 * @param {string} serviceType - The service type title
 * @param {number} maxDistance - Maximum distance in kilometers (default: 50)
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getJobsByLocationAndType(
  location,
  serviceType,
  maxDistance = 300
) {
  try {
    // First, get all requests with status "in progress"
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceRequestsId,
      [Query.equal("status", "in progress"), Query.orderDesc("$createdAt")]
    );

    console.log("Found total requests:", response.documents.length);

    // Filter requests by service type and distance
    const filteredRequests = await Promise.all(
      response.documents.map(async (request) => {
        try {
          // Check service type match first
          if (request.serviceType !== serviceType) {
            console.log(`Service type mismatch for request ${request.$id}:`, {
              requestType: request.serviceType,
              expectedType: serviceType,
            });
            return null;
          }

          // Fetch the address document
          const addressDoc = await databases.getDocument(
            settings.dataBaseId,
            settings.addrressessId,
            request.address
          );

          if (!addressDoc) {
            console.log(`No address found for request ${request.$id}`);
            return null;
          }

          const requestLat = addressDoc.latitude;
          const requestLon = addressDoc.longitude;

          if (!requestLat || !requestLon) {
            console.log(`Invalid coordinates for request ${request.$id}`);
            return null;
          }

          // Log coordinates for debugging
          console.log('Calculating distance between:', {
            artisan: { lat: location.latitude, lon: location.longitude },
            request: { lat: requestLat, lon: requestLon }
          });

          // Convert latitude and longitude to radians
          const lat1Rad = location.latitude * (Math.PI / 180);
          const lon1Rad = location.longitude * (Math.PI / 180);
          const lat2Rad = requestLat * (Math.PI / 180);
          const lon2Rad = requestLon * (Math.PI / 180);

          // Haversine formula components
          const dLat = lat2Rad - lat1Rad;
          const dLon = lon2Rad - lon1Rad;

          // Simplified Haversine formula
          const R = 6371; // Earth's radius in kilometers
          const a = 
            Math.pow(Math.sin(dLat/2), 2) + 
            Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
            Math.pow(Math.sin(dLon/2), 2);
          
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          console.log(`Distance calculated for request ${request.$id}: ${distance.toFixed(2)}km`);

          if (distance <= maxDistance) {
            return {
              ...request,
              distance: parseFloat(distance.toFixed(2)),
              address: addressDoc,
            };
          }
          return null;
        } catch (err) {
          console.error(`Error processing request ${request.$id}:`, err);
          return null;
        }
      })
    );

    // Remove null values and sort by distance
    const validRequests = filteredRequests
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);

    console.log("Found matching requests:", {
      total: validRequests.length,
      maxDistance,
      serviceType
    });

    return {
      success: true,
      data: validRequests,
      error: null,
    };
  } catch (error) {
    console.error("Error in getJobsByLocationAndType:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}
