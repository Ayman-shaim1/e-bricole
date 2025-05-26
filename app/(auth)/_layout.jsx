import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { checkSession } from "../../services/authService";

export default function AuthLayout() {
  const router = useRouter();

  useEffect(() => {
    const verify = async () => {
      const session = await checkSession();
      if (session.loggedIn) {
        router.replace("/(client)/home");
      }
    };
    verify();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
