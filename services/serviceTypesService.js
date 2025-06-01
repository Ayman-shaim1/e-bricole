import { databases } from "../config/appwrite";
import settings from "../config/settings";

/**
 * Gets all service types from the database
 * @returns {Promise<Array>} Array of service types with their IDs and titles
 */
export async function getServicesTypes() {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.servicesTypesId
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title
    }));
  } catch (error) {
    console.error("Error fetching service types:", error);
    return [];
  }
}
