import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import { useAuth } from "../../context/AuthContext";
import { getNotifications } from "../../services/notificationService";
import { subscribeToNotifications } from "../../services/realtimeService";
import GoBackButton from "../../components/GoBackButton";
import StyledCard from "../../components/StyledCard";
import Divider from "../../components/Divider";
import StyledLabel from "../../components/StyledLabel";
import { colors } from "../../constants/colors";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}/${pad(
    date.getMonth() + 1
  )}/${date.getFullYear()} at ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const unseenCount = notifications.filter((n) => !n.isSeen).length;

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await getNotifications(user.$id);
    if (res.success) setNotifications(res.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notifications
    const unsubscribe = subscribeToNotifications(user.$id, (newNotification) => {
      setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <GoBackButton />
        <StyledHeading text="Notifications" />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <TouchableOpacity>
          <StyledLabel text="Mark all as read" color="primary" />
        </TouchableOpacity>
      </View>
      <Divider />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <StyledCard style={!item.isSeen ? styles.unseenCard : null}>
              <View style={styles.titleContainer}>
                <StyledHeading text={item.title} style={styles.title} />
                {!item.isSeen && <View style={styles.unseenDot} />}
              </View>
              <StyledText text={item.messageContent} style={styles.content} />
              <Divider />
              <StyledLabel text={formatDate(item.$createdAt)} />
            </StyledCard>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <StyledText text="No notifications." style={styles.empty} />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: "bold" },
  content: { fontSize: 14 },
  unseenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  unseenCard: {
    backgroundColor: colors.primary + "10",
  },
  badge: {
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});
