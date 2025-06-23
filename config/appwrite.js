// Add localStorage polyfill for React Native
if (typeof window !== 'undefined' && !window.localStorage) {
  window.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0
  };
}

import 'react-native-url-polyfill/auto';
import { Client, Account, Databases, Storage } from "appwrite";

// Initialize the Appwrite client with better connection settings
const client = new Client();

// Set the endpoint and project ID with improved settings
client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("682cda25001d5287c1df")

// Add connection timeout and retry settings

// Initialize services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Add global error handler for the client


// Add retry mechanism for failed requests
const originalRequest = client.request;
client.request = async function(config) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await originalRequest.call(this, config);
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error types
      if (error.code === 401 || error.code === 403 || error.code === 404) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        console.warn(`Request failed (attempt ${attempt}/${maxRetries}), retrying...`, error.message);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
};

// Export the initialized services
export { client, account, databases, storage };
