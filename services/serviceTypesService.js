import { databases } from "../config/appwrite";
import settings from "../config/settings";

export async function getServicesTypes() {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.servicesTypesId
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching documents:", error.message);
    return [];
  }
}
