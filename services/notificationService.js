import { databases } from "../config/appwrite";
import { ID, Query } from "appwrite";
import settings from "../config/settings";

/**
 * Creates a notification document
 * @param {Object} data - { senderUser, receiverUser, title, messageContent }
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
export async function createNotification(data) {
  try {
    const notificationDoc = {
      senderUser: data.senderUser,
      receiverUser: data.receiverUser,
      title: data.title,
      messageContent: data.messageContent,
      isSeen: false,
    };
    const response = await databases.createDocument(
      settings.dataBaseId,
      settings.notificationId,
      ID.unique(),
      notificationDoc
    );
    return { success: true, notificationId: response.$id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Gets all notifications for a user (receiverUser)
 * @param {string} userId
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export async function getNotifications(userId) {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.notificationId,
      [Query.equal("receiverUser", userId), Query.orderDesc("$createdAt")]
    );
    return { success: true, data: response.documents };
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
}
