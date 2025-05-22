import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { checkSession } from "../services/authService";

export default function Index() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    (async () => {
      const session = await checkSession();
      setTarget(session.loggedIn ? "/home" : "/login");
    })();
  }, []);

  if (!target) return null;

  return <Redirect href={target} />;
}
