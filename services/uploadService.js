import { client, storage, account } from "../config/appwrite";
import { ID, Permission, Role } from "appwrite";
import settings from "../config/settings";
import * as FileSystem from 'expo-file-system';

// Storage is already initialized in appwrite.js

/**
 * Uploads a file to Appwrite Storage using a direct fetch approach
 * @param {string} uri - The local URI of the file to upload
 * @param {string} fileType - The MIME type of the file (e.g., 'image/jpeg')
 * @returns {Promise<{success: boolean, fileUrl: string|null, fileId: string|null, error: string|null}>}
 */
export async function uploadFile(uri, fileType = 'image/jpeg') {
  try {
    console.log('Starting file upload for URI:', uri);
    
    if (!uri || typeof uri !== 'string') {
      throw new Error('Invalid file URI provided');
    }
    
    // Check if the file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist at URI: ' + uri);
    }
    
    console.log('File exists, size:', fileInfo.size);
    
    // For React Native, we need to use a direct fetch approach
    // Get the Appwrite endpoint and project ID from the client
    const endpoint = client.config.endpoint;
    const projectId = client.config.project;
    
    // Construct the URL for the Appwrite Storage API
    const url = `${endpoint}/storage/buckets/${settings.bucketId}/files`;
    
    // Generate a unique file ID
    const fileId = ID.unique();
    
    // Create a FormData object
    const formData = new FormData();
    
    // Extract the filename from the URI
    const filename = uri.split('/').pop() || `file-${Date.now()}.jpg`;
    
    // Append the file and fileId to the FormData
    formData.append('fileId', fileId);
    formData.append('file', {
      uri: uri,
      name: filename,
      type: fileType,
    });
    
    // Skip permissions in the FormData - we'll use the default permissions
    // This avoids the permission format issues
    
    console.log('Uploading file to Appwrite...');
    
    // Get the current session token for authentication
    let sessionToken = '';
    try {
      const currentSession = await account.getSession('current');
      sessionToken = currentSession?.secret || '';
    } catch (sessionError) {
      console.log('No active session, uploading without authentication');
      // Continue without a session token
    }
    
    // Make the fetch request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Session': sessionToken,
      },
      body: formData,
    });
    
    // Parse the response
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload file');
    }
    
    console.log('File uploaded successfully, result:', result);
    
    // Get the file ID from the response
    const responseFileId = result.$id || fileId;
    
    // Return the file URL for viewing with project and mode parameters
    const fileUrl = `${endpoint}/storage/buckets/${settings.bucketId}/files/${responseFileId}/view?project=${projectId}&mode=admin`;
    
    console.log('File uploaded successfully, URL:', fileUrl);
    return { success: true, fileUrl, fileId, error: null };
  } catch (error) {
    console.error('Error uploading file:', error);
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
