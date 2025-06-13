import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export default function useNotificationListeners() {
  useEffect(() => {
    // Quand une notification arrive (app au premier plan)
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification reçue :', notification);
    });

    // Quand l'utilisateur clique sur une notification (foreground ou background)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📲 Notification cliquée :', response);
      // Exemple d'action : naviguer vers un écran
      // navigation.navigate(response.notification.request.content.data.screen);
    });

    // Nettoyage
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);
}
