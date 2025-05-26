import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { checkSession } from "../services/authService";

export default function Index() {
  const [target, setTarget] = useState(null);

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

  if (!target) return null;

  return <Redirect href={target} />;
}
