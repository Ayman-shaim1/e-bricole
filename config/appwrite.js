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

// Initialize the Appwrite client
const client = new Client();

// Set the endpoint and project ID
client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("682cda25001d5287c1df");
// Initialize services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Export the initialized services
export { client, account, databases, storage };
