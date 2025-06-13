import { Client, Account, Databases, Storage } from "react-native-appwrite";

// Initialize the Appwrite client
const client = new Client();

// Set the endpoint and project ID
client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("682cda25001d5287c1df")
  .setLocale("en-US");

// Initialize services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Debug log to verify account service
console.log("Account service methods:", Object.keys(account));

// Verify client initialization
if (!client || !account || !databases || !storage) {
  console.error("Failed to initialize Appwrite services");
  throw new Error("Appwrite services initialization failed");
}

// Export the initialized services
export { client, account, databases, storage };
