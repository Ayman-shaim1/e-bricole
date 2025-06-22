import { databases } from "../config/appwrite";
import settings from "../config/settings";

export const getArtisanById = async (artisanId) => {
  try {
    const response = await databases.getDocument(
      settings.dataBaseId,
      settings.usersId,
      artisanId
    );
    return {
      name: response.name,
      email: response.email,
      profileImage: response.profileImage,
      skills: response.skills || [],
      profession: response.profession,
      experienceYears: response.experienceYears,
      profileImageId: response.profileImageId,
      serviceType: response.serviceType,
      isClient: response.isClient,
    };
  } catch (error) {
    console.error("Error fetching artisan data:", error);
    return null;
  }
};

/**
 * Get user data by ID including expoPushToken
 * @param {string} userId - The user's ID
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export const getUserById = async (userId) => {
  try {
    const response = await databases.getDocument(
      settings.dataBaseId,
      settings.usersId,
      userId
    );
    return { success: true, user: response };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user's expo push token
 * @param {string} userId - The user's ID
 * @param {string} expoPushToken - The expo push token
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserPushToken = async (userId, expoPushToken) => {
  try {
    await databases.updateDocument(
      settings.dataBaseId,
      settings.usersId,
      userId,
      { expoPushToken }
    );
    console.log("Push token updated successfully for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error updating push token:", error);
    return { success: false, error: error.message };
  }
};
