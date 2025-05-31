import { databases } from "../config/appwrite";
import { ID } from "appwrite";
import settings from "../config/settings";
import { uploadFile } from "./uploadService";

/**
 * Creates a new request in the database
 * @param {Object} requestData - The request data to be saved
 * @returns {Promise<{success: boolean, requestId: string|null, error: string|null}>}
 */
export async function createRequest(requestData) {
  try {
    console.log("Creating request with data:", requestData);

    // First, upload any images if present
    const uploadedImages = [];
    if (requestData.images && requestData.images.length > 0) {
      for (const imageUri of requestData.images) {
        const uploadResult = await uploadFile(imageUri);
        if (uploadResult.success) {
          uploadedImages.push({
            url: uploadResult.fileUrl,
            id: uploadResult.fileId
          });
        } else {
          console.error("Failed to upload image:", uploadResult.error);
        }
      }
    }

    // Prepare the request document
    const requestDoc = {
      title: requestData.title,
      description: requestData.description,
      serviceType: requestData.serviceType,
      address: requestData.address,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      totalPrice: parseFloat(requestData.totalPrice.replace(',', '.')),
      tasks: requestData.tasks.map(task => ({
        ...task,
        price: parseFloat(task.price.toString().replace(',', '.'))
      })),
      images: uploadedImages,
      status: "pending", // Initial status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create the request document in the database
    const response = await databases.createDocument(
      settings.dataBaseId,
      settings.requestsId,
      ID.unique(),
      requestDoc
    );

    console.log("Request created successfully:", response);

    return {
      success: true,
      requestId: response.$id,
      error: null
    };
  } catch (error) {
    console.error("Error creating request:", error);
    return {
      success: false,
      requestId: null,
      error: error.message
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
      settings.requestsId
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
 * @returns {Promise<Object|null>}
 */
export async function getRequestById(requestId) {
  try {
    const response = await databases.getDocument(
      settings.dataBaseId,
      settings.requestsId,
      requestId
    );
    return response;
  } catch (error) {
    console.error("Error fetching request:", error);
    return null;
  }
} 