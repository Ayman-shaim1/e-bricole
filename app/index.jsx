// localStorage polyfill for React Native (mostly needed for some SDKs that assume browser env)
if (typeof window !== "undefined" && !window.localStorage) {
  window.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { checkSession } from "../services/authService";
import SplashComponent from "./splash";
import { updateUserPushToken } from "../services/userService";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function Index() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    // Notifications permissions + listeners
    (async () => {
      // Request permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }

      // Get Expo push token (optional: send to backend)
      const tokenData = await Notifications.getExpoPushTokenAsync();

      // Optional: listener for notification tapped
      const responseListener =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("Notification response received", response);
          // Optional: navigate based on notification data
          // const route = response.notification.request.content.data.route;
          // if (route) router.push(route);
        });

      // Check session and route
      try {
        const session = await checkSession();

        if (session.loggedIn) {
          updateUserPushToken(session.user.$id, tokenData.data);
          const isClient = session.isClient === true;
          setTarget(isClient ? "/(client)/home" : "/(artisan)/dashboard");
        } else {
          setTarget("/(auth)/login");
        }
      } catch (error) {
        setTarget("/(auth)/login");
      }

      // Cleanup listener
      return () => {
        Notifications.removeNotificationSubscription(responseListener);
      };
    })();
  }, []);

  if (!target) return <SplashComponent />;

  return <Redirect href={target} />;
}
