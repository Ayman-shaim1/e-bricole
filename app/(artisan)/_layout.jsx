import { Tabs, useRouter, Stack } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useBadge } from "../../context/BadgeContext";
import TabBadge from "../../components/TabBadge";
import { useFocusEffect } from '@react-navigation/native';

export default function AppLayout() {
  const router = useRouter();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const { isAuthenticated, user } = useAuth();
  const { 
    getNotificationBadgeCount, 
    getMessageBadgeCount, 
    updateCurrentScreen 
  } = useBadge();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: theme.iconColor,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.cardColor,
          borderTopColor: theme.iconColor + '20',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Poppins-Regular',
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          // Update current screen when tab is pressed
          const routeName = e.target?.split('-')[0] || '';
          updateCurrentScreen(routeName);
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="grid-outline" size={size} color={color} />
              <TabBadge count={getNotificationBadgeCount()} />
            </View>
          ),
        }}
        listeners={{
          focus: () => updateCurrentScreen('dashboard'),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          focus: () => updateCurrentScreen('jobs'),
        }}
      />
      <Tabs.Screen
        name="current-jobs"
        options={{
          title: "My Jobs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          focus: () => updateCurrentScreen('current-jobs'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="chatbox-outline" size={size} color={color} />
              <TabBadge count={getMessageBadgeCount()} />
            </View>
          ),
        }}
        listeners={{
          focus: () => updateCurrentScreen('messages'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          focus: () => updateCurrentScreen('settings'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addTabButton: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});
