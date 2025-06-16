import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { checkSession } from "../services/authService";
import SplashComponent from "./splash";
// import useNotificationListeners from "../hooks/useNotificationListeners";
// import * as Notifications from "expo-notifications";

// Configuration du comportement des notifications
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowBanner: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//   }),
// });

export default function Index() {
  const [target, setTarget] = useState(null);
  // useNotificationListeners();
  useEffect(() => {
    (async () => {
      try {
        const session = await checkSession();
        if (session.loggedIn) {
          // Redirect based on user type
          const isClient = session.isClient === true;

          if (isClient) {
            setTarget("/(client)/home");
          } else {
            setTarget("/(artisan)/dashboard");
          }
        } else {
          setTarget("/(auth)/login");
        }
      } catch (error) {
        setTarget("/(auth)/login");
      }
    })();
  }, []);

  // useEffect(() => {
  //   registerForPushNotificationsAsync();
  // }, []);

  if (!target) return <SplashComponent />;

  return <Redirect href={target} />;
}


// async function registerForPushNotificationsAsync() {
//   const { status } = await Notifications.requestPermissionsAsync();
//   if (status !== "granted") {
//     alert("Permission refusée");
//     return;
//   }

//   const { data: token } = await Notifications.getExpoPushTokenAsync();
//   console.log("✅ Expo Push Token:", token);
// }
