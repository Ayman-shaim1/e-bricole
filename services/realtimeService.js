import { client } from "../config/appwrite";
import settings from "../config/settings";
import { databases } from "../config/appwrite";

export const subscribeToNotifications = (userId, onNotificationReceived, onCountUpdate) => {
  const channel = `databases.${settings.dataBaseId}.collections.${settings.notificationId}.documents`;
  
  return client.subscribe(channel, async (response) => {
    // Only process if it's a new notification for the current user
    if (response.payload.receiverUser.$id === userId) {
      // Only handle new notifications (created event)
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        // Mark as seen in database but keep UI styling
        try {
          await databases.updateDocument(
            settings.dataBaseId,
            settings.notificationId,
            response.payload.$id,
            { isSeen: true }
          );
        } catch (error) {
          console.error("Error marking notification as seen:", error);
        }
        
        // Pass the notification to the handler
        onNotificationReceived(response.payload);
        
        // Update the unseen count
        if (onCountUpdate) {
          onCountUpdate(prevCount => prevCount + 1);
        }
      }
    }
  });
};
