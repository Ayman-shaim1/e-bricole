import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { checkSession } from "../services/authService";
import SplashComponent from "./splash";
import useNotificationListeners from "../hooks/useNotificationListeners";

export default function Index() {
  const [target, setTarget] = useState(null);
  useNotificationListeners();
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
        }
        else {
          setTarget("/(auth)/login");
        }
      } catch (error) {
        setTarget("/(auth)/login");
      }
    })();
  }, []);

  if (!target) return <SplashComponent />;

  return <Redirect href={target} />;
}
