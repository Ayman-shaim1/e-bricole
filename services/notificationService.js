import { databases } from "../config/appwrite";
import { ID, Query } from "react-native-appwrite";
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
    console.log('notification response', response);
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

/**
 * Gets the count of unseen notifications for a user
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUnseenNotificationCount(userId) {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.notificationId,
      [
        Query.equal("receiverUser", userId),
        Query.equal("isSeen", false)
      ]
    );
    return response.documents.length;
  } catch (error) {
    return 0;
  }
}

/**
 * Marks all notifications as seen for a user
 * @param {string} userId
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markAllNotificationsAsSeen(userId) {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.notificationId,
      [Query.equal("receiverUser", userId), Query.equal("isSeen", false)]
    );

    // Update each unseen notification
    const updatePromises = response.documents.map(doc => 
      databases.updateDocument(
        settings.dataBaseId,
        settings.notificationId,
        doc.$id,
        { isSeen: true }
      )
    );

    await Promise.all(updatePromises);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
