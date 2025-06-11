import { client } from "../config/appwrite";
import settings from "../config/settings";

/**
 * Souscrit aux notifications en temps réel pour un utilisateur donné.
 * @param {string} userId - L'ID de l'utilisateur qui doit recevoir les notifications.
 * @param {function} onNotification - Callback à appeler lorsqu'une notification est reçue.
 * @returns {function|null} Une fonction pour se désabonner, ou null si la souscription échoue.
 */
export function subscribeToNotifications(userId, onNotification) {
  try {
    const channel = `databases.${settings.dataBaseId}.collections.${settings.notificationId}.documents`;
    const unsubscribe = client.subscribe(
      channel,
      (response) => {
        const eventType = response.events[0];
        const payload = response.payload;
        
        // Only process if we have a payload
        if (payload) {
          // Check if the notification is for this user
          if (payload.userId === userId) {
            // Call the callback with the notification data
            onNotification({
              ...payload,
              $id: payload.$id,
              $createdAt: payload.$createdAt,
              isSeen: false
            });
          }
        }
      }
    );

    return unsubscribe; // Permet de se désabonner plus tard
  } catch (err) {
    console.error("❌ Échec de la souscription en temps réel :", err.message);
    return null;
  }
}
