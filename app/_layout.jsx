// Add localStorage polyfill for React Native
if (typeof window !== 'undefined' && !window.localStorage) {
  window.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0
  };
}

import 'react-native-url-polyfill/auto';
import { StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { Stack, useSegments, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import SplashComponent from "./splash";
import { NotificationProvider } from "../context/NotificationContext";
SplashScreen.preventAutoHideAsync();

// Inner component for handling route protection and redirection
function RootLayoutNav() {
  const { isAuthenticated, isLoading, user, userRole } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    // Handle authentication redirects
    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect based on user type
      if (userRole === true) {
        router.replace("/(client)/home");
      } else {
        router.replace("/(artisan)/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <SplashComponent />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <RootLayoutNav />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

