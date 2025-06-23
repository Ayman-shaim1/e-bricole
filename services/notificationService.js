import { databases } from "../config/appwrite";
import { ID, Query } from "appwrite";
import settings from "../config/settings";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getUserById } from "./userService";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Register for push notifications
 * @returns {Promise<{success: boolean, token?: string, error?: string}>}
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return {
        success: false,
        error: "Failed to get push token for push notification!",
      };
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "d57d47d3-c762-421c-8b19-3fbfdae4d151", 
        })
      ).data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  } else {
    return {
      success: false,
      error: "Must use physical device for Push Notifications",
    };
  }

  return { success: true, token };
}


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
      type: data.type,
      jsonData: data.jsonData,
      isSeen: false,
    };
    
    // Create the notification document
    const response = await databases.createDocument(
      settings.dataBaseId,
      settings.notificationId,
      ID.unique(),
      notificationDoc
    );
    console.log("notification response", response);
    
    // Fetch receiver's data to get their expoPushToken
    const receiverResult = await getUserById(data.receiverUser);
    
    if (receiverResult.success && receiverResult.user.expoPushToken) {
      // Send push notification to the receiver
      const pushResult = await sendPushNotification(
        receiverResult.user.expoPushToken,
        data.title,
        data.messageContent,
        {
          notificationId: response.$id,
          type: data.type,
          jsonData: data.jsonData,
          ...data
        }
      );
      
      if (pushResult.success) {
        console.log('Push notification sent successfully to user:', data.receiverUser);
      } else {
        console.warn('Failed to send push notification:', pushResult.error);
      }
    } else {
      console.log('No expoPushToken found for user:', data.receiverUser);
    }
    
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
      [Query.equal("receiverUser", userId), Query.equal("isSeen", false)]
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
    const updatePromises = response.documents.map((doc) =>
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

/**
 * Sends a push notification to a specific user
 * @param {string} expoPushToken - The user's Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with the notification
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendPushNotification(expoPushToken, title, body, data = {}) {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      badge: 1,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Push notification sent successfully:', result);
      return { success: true };
    } else {
      console.error('Failed to send push notification:', result);
      return { success: false, error: result.errors?.[0]?.message || 'Failed to send notification' };
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}
