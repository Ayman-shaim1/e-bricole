import { client, storage, account } from "../config/appwrite";
import { ID } from "appwrite";
import settings from "../config/settings";
import * as FileSystem from "expo-file-system";

/**
 * Uploads a file to Appwrite Storage
 * @param {string} uri - The local URI of the file to upload
 * @param {string} fileType - The MIME type of the file (e.g., 'image/jpeg')
 * @returns {Promise<{success: boolean, fileUrl: string|null, fileId: string|null, error: string|null}>}
 */
export async function uploadFile(uri, fileType = "image/jpeg") {
  try {
    console.log("Starting file upload for URI:", uri);

    if (!uri || typeof uri !== "string") {
      throw new Error("Invalid file URI provided");
    }

    // Check if the file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error("File does not exist at URI: " + uri);
    }

    console.log("File exists, size:", fileInfo.size);

    // Get the file extension from the URI
    const fileExtension = uri.split(".").pop().toLowerCase();
    const mimeType = fileExtension === "png" ? "image/png" : "image/jpeg";

    // Extract the filename from the URI
    const filename =
      uri.split("/").pop() || `image-${Date.now()}.${fileExtension}`;

    // Generate a unique file ID
    const fileId = ID.unique();

    // Create a FormData object
    const formData = new FormData();
    formData.append("fileId", fileId); // ✅ add fileId in the body
    formData.append("file", {
      uri: uri,
      name: filename,
      type: mimeType,
    });

    // Get the endpoint and project ID
    const endpoint = client.config.endpoint;
    const projectId = client.config.project;

    // Get the current session token for authentication
    let sessionToken = "";
    try {
      const currentSession = await account.getSession("current");
      sessionToken = currentSession?.secret || "";
    } catch (sessionError) {
      console.log("No active session, uploading without authentication");
    }

    // Construct the URL for the Appwrite Storage API
    const url = `${endpoint}/storage/buckets/${settings.bucketId}/files`;

    // Make the fetch request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Appwrite-Project": projectId,
        ...(sessionToken && { "X-Appwrite-Session": sessionToken }),
        // DO NOT manually set Content-Type, let fetch handle it for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to upload file");
    }

    const result = await response.json();
    console.log("File uploaded successfully, result:", result);

    // Get the file URL
    const fileUrl = `${endpoint}/storage/buckets/${settings.bucketId}/files/${result.$id}/view?project=${projectId}`;

    return { success: true, fileUrl, fileId: result.$id, error: null };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      success: false,
      fileUrl: null,
      fileId: null,
      error: error.message,
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
      error: null,
    };
  } catch (error) {
    console.error("Error deleting file:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
