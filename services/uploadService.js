import { client } from "../config/appwrite";
import { Storage, ID } from "appwrite";
import settings from "../config/settings";

// Initialize Appwrite Storage
const storage = new Storage(client);

/**
 * Uploads a file to Appwrite Storage
 * @param {string} uri - The local URI of the file to upload
 * @param {string} fileType - The MIME type of the file (e.g., 'image/jpeg')
 * @returns {Promise<{success: boolean, fileUrl: string|null, fileId: string|null, error: string|null}>}
 */
export async function uploadFile(uri, fileType = 'image/jpeg') {
  try {
    // Convert URI to Blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Generate a unique file name
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Upload file to Appwrite Storage
    const result = await storage.createFile(
      settings.bucketId, // Make sure this is defined in your settings
      ID.unique(),
      blob,
      [`role:all`], // Public read access
      [`user:${settings.userId}`] // Only the user can write
    );
    
    // Get the file URL
    const fileUrl = storage.getFileView(settings.bucketId, result.$id);
    
    return {
      success: true,
      fileUrl,
      fileId: result.$id,
      error: null
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      success: false,
      fileUrl: null,
      fileId: null,
      error: error.message
    };
  }
}

/**
 * Deletes a file from Appwrite Storage
 * @param {string} fileId - The ID of the file to delete
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteFile(fileId) {
  try {
    await storage.deleteFile(settings.bucketId, fileId);
    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error deleting file:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
