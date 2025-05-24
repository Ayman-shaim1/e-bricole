import { account, databases } from "../config/appwrite";
import { ID } from "appwrite";
import settings from "../config/settings";
import { uploadFile } from "./uploadService";

export async function registerUser({ name, email, password, isClient, profileImage, skills, serviceType, profession, experienceYears }) {
  try {
    // Step 1: Create the user account
    const user = await account.create(ID.unique(), email, password, name);
    
    // Step 2: Upload profile image if provided
    let profileImageUrl = null;
    let profileImageId = null;
    
    if (profileImage) {
      const uploadResult = await uploadFile(profileImage);
      if (uploadResult.success) {
        profileImageUrl = uploadResult.fileUrl;
        profileImageId = uploadResult.fileId;
      } else {
        console.log("Warning: Failed to upload profile image:", uploadResult.error);
      }
    }
    
    // Step 3: Create the user document with all provided information
    const userData = {
      name,
      email,
      isClient,
      profileImageUrl,
      profileImageId
    };
    
    // Add artisan-specific fields if the user is an artisan
    if (!isClient) {
      if (skills && skills.length > 0) userData.skills = skills;
      if (serviceType) userData.serviceType = serviceType;
      if (profession) userData.profession = profession;
      if (experienceYears) userData.experienceYears = experienceYears;
    }
    
    await databases.createDocument(
      settings.dataBaseId,
      settings.usersId,
      user.$id,
      userData
    );

    return { success: true, userId: user.$id };
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
