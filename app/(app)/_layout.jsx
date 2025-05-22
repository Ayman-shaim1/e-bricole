import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { checkSession } from "../../services/authService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "../../constants/colors";

// Custom component to style the Add tab icon
function AddTabIcon({ size }) {
  return (
    <View style={styles.addTabButton}>
      <Ionicons name="add" size={size + 5} color={colors.white} />
    </View>
  );
}

export default function AppLayout() {
  const router = useRouter();

  useEffect(() => {
    const verify = async () => {
      const session = await checkSession();
      if (!session.loggedIn) {
        router.replace("/login");
      }
    };
    verify();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: AddTabIcon,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-outline" size={size} color={color} />
          ),
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
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarStyle: {
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
    backgroundColor: colors.white,
  },
  tabBarLabelStyle: {
    fontSize: 12,
  },
  addTabButton: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});
