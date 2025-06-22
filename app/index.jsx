import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { checkSession } from "../services/authService";
import SplashComponent from "./splash";
// import registerNNPushToken from 'native-notify';

export default function Index() {
  // registerNNPushToken(30842, 'V74ObSdRBvhZ1iPlRAbCMt');
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


