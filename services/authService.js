import { account, databases } from "../config/appwrite";
import { ID } from "appwrite";
import settings from "../config/settings";

export async function registerUser({ name, email, password, isClient }) {
  try {
    const user = await account.create(ID.unique(), email, password, name);
    await databases.createDocument(
      settings.dataBaseId,
      settings.usersId,
      user.$id,
      {
        name,
        email,
        isClient,
      }
    );

    return { success: true };
  } catch (error) {
    console.log("Erreur inscription Appwrite :", error.message);
    return { success: false, error: error.message };
  }
}

export async function loginUser({ email, password }) {
  try {
    const session = await account.createEmailSession(email, password);
    const user = await account.get(); // Fetch user data

    return { success: true, user };
  } catch (error) {
    console.log("Login error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function checkSession() {
  try {
    const user = await account.get(); 
    return { loggedIn: true, user };
  } catch (error) {
    return { loggedIn: false };
  }
}

export async function logoutUser() {
  try {
    await account.deleteSession("current");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
