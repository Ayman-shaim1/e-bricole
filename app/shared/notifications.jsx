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
import { useNotifications } from "../../context/NotificationContext";
import {
  getNotifications,
  getUnseenNotificationCount,
  markAllNotificationsAsSeen,
} from "../../services/notificationService";
import { subscribeToNotifications } from "../../services/realtimeService";
import GoBackButton from "../../components/GoBackButton";
import StyledCard from "../../components/StyledCard";
import Divider from "../../components/Divider";
import StyledLabel from "../../components/StyledLabel";
import StyledButton from "../../components/StyledButton";
import { colors } from "../../constants/colors";
import { useRouter } from "expo-router";

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
  const { setUnseenCount } = useNotifications();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unseenCount, setLocalUnseenCount] = useState(0);
  const [markingAsSeen, setMarkingAsSeen] = useState(false);

  const handleMarkAllAsSeen = async () => {
    if (markingAsSeen || unseenCount === 0) return;

    setMarkingAsSeen(true);
    const result = await markAllNotificationsAsSeen(user.$id);

    if (result.success) {
      // Update both database and UI
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isSeen: true,
        }))
      );
      // Reset unseen count to update both notifications screen and header
      setLocalUnseenCount(0);
      setUnseenCount(0);
    }
    setMarkingAsSeen(false);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await getNotifications(user.$id);
    if (res.success) {
      // Keep the original isSeen state from the database for UI
      setNotifications(res.data);
    }
    const count = await getUnseenNotificationCount(user.$id);
    setLocalUnseenCount(count);
    setUnseenCount(count);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      // First fetch notifications to get the current state
      const res = await getNotifications(user.$id);
      if (res.success) {
        setNotifications(res.data);
      }

      // Get the current unseen count
      const count = await getUnseenNotificationCount(user.$id);
      setLocalUnseenCount(count);
      setUnseenCount(count);

      // Then update the database without changing the UI state
      await markAllNotificationsAsSeen(user.$id);

      setLoading(false);
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    const handleNewNotification = async (newNotification) => {
      // Check if notification already exists in the list
      const exists = notifications.some((n) => n.$id === newNotification.$id);
      if (!exists) {
        // Add new notification to the top of the list with isSeen = false for UI
        setNotifications((prev) => [
          {
            ...newNotification,
            isSeen: false, // Force isSeen to false for UI styling
          },
          ...prev,
        ]);
      }
    };

    const unsubscribe = subscribeToNotifications(
      user.$id,
      handleNewNotification,
      (prevCount) => {
        setLocalUnseenCount(prevCount);
        setUnseenCount(prevCount);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user.$id, notifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleShowNotification = (notification) => {
    console.log(
      "Notification type:",
      notification.type,
      typeof notification.type
    );
    console.log("Notification jsonData:", notification.jsonData);

    if (notification.type === "application" && notification.jsonData) {
      try {
        const data = JSON.parse(notification.jsonData);
        console.log("Parsed jsonData:", data);
        console.log("serviceApplicationId:", data.serviceApplicationId);
        console.log("serviceApplicationId type:", typeof data.serviceApplicationId);
        console.log("serviceApplicationId length:", data.serviceApplicationId?.length);
        
        if (data.serviceApplicationId) {
          // Validate the ID format
          if (data.serviceApplicationId.length > 36 || !/^[a-zA-Z0-9_]+$/.test(data.serviceApplicationId)) {
            console.error("Invalid serviceApplicationId format:", data.serviceApplicationId);
            alert("This notification contains an invalid application ID. Please contact support.");
            return;
          }
          
          router.push({
            pathname: "/shared/application-details",
            params: { applicationId: data.serviceApplicationId },
          });
        } else {
          alert("Application ID not found in notification data.");
        }
      } catch (error) {
        console.error("Error parsing notification jsonData:", error);
        alert("Error processing notification data. Please try again.");
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <GoBackButton />
          <StyledHeading text="Notifications" />
        </View>
        {unseenCount > 0 && (
          <View style={styles.badge}>
            <StyledLabel text={unseenCount.toString()} color="white" />
          </View>
        )}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <TouchableOpacity
          onPress={handleMarkAllAsSeen}
          disabled={markingAsSeen || unseenCount === 0}
        >
          <StyledLabel
            text={markingAsSeen ? "Marking as seen..." : "Mark all as seen"}
            color={markingAsSeen || unseenCount === 0 ? "gray" : "primary"}
          />
        </TouchableOpacity>
      </View>
      <Divider />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => `notification-${item.$id}-${item.$createdAt}`}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            return (
              <StyledCard style={!item.isSeen ? styles.unseenCard : null}>
                <View style={styles.titleContainer}>
                  <StyledHeading text={item.title} style={styles.title} />
                  {!item.isSeen && <View style={styles.unseenDot} />}
                </View>
                <StyledText text={item.messageContent} style={styles.content} />
                {item.type === "application" && (
                  <View style={styles.buttonContainer}>
                    <StyledButton
                      text="Show application"
                      onPress={() => handleShowNotification(item)}
                      color="primary"
                      style={styles.showButton}
                    />
                  </View>
                )}
                <Divider />
                <StyledLabel text={formatDate(item.$createdAt)} />
              </StyledCard>
            );
          }}
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
    justifyContent: "space-between",
    paddingRight: 10,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: "bold" },
  content: { fontSize: 14 },
  buttonContainer: {
    marginTop: 10,
    alignItems: "flex-start",
  },
  showButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
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
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
});
