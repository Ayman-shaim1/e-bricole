import { Client, Account, Databases, Storage } from "react-native-appwrite";

// Initialize the react-native-appwrite client
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
