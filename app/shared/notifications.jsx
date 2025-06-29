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
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [markingAsSeen, setMarkingAsSeen] = useState(false);
  const [visuallySeenIds, setVisuallySeenIds] = useState(new Set()); // Track which notifications are visually seen
  const [isFirstVisit, setIsFirstVisit] = useState(true); // Track if this is the first visit to the page
  const [newNotificationIds, setNewNotificationIds] = useState(new Set()); // Track newly received notifications

  const handleMarkAllAsSeen = async () => {
    if (markingAsSeen) return;

    setMarkingAsSeen(true);
    
    // Update visual state - mark all notifications as visually seen
    const allNotificationIds = notifications.map(n => n.$id);
    setVisuallySeenIds(new Set(allNotificationIds));
    
    // Clear new notification tracking
    setNewNotificationIds(new Set());
    
    setMarkingAsSeen(false);
  };

  const fetchNotifications = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    const res = await getNotifications(user.$id);
    if (res.success) {
      setNotifications(res.data);
    }
    const count = await getUnseenNotificationCount(user.$id);
    setUnseenCount(count);
    if (isInitialLoad) setLoading(false);
    setRefreshing(false);
  };

  // Initialize notifications on mount and mark as seen in database
  useEffect(() => {
    if (user?.$id) {
      const initializeAndMarkSeen = async () => {
        // First fetch notifications
        const res = await getNotifications(user.$id);
        if (res.success) {
          setNotifications(res.data);
          
          // Check if this is first visit by looking at notifications data
          const hasUnseenNotifications = res.data.some(notification => !notification.isSeen);
          
          if (hasUnseenNotifications) {
            // First visit - mark as seen in DB but keep visual style unseen
            setIsFirstVisit(true);
            const result = await markAllNotificationsAsSeen(user.$id);
            if (result.success) {
              // Update only the count for header badge, keep UI style unchanged
              setUnseenCount(0);
            }
          } else {
            // Not first visit - notifications already seen in DB, should appear as seen
            setIsFirstVisit(false);
            setUnseenCount(0);
          }
        }
        
        setLoading(false);
        setRefreshing(false);
      };
      
      initializeAndMarkSeen();
    }
  }, [user?.$id]);

  // Subscribe to new notifications in real-time
  useEffect(() => {
    if (!user?.$id) return;

    const unsubscribe = subscribeToNotifications(user.$id, (response) => {
      const isForCurrentUser = response?.payload?.receiverUser?.$id === user.$id;
      if (isForCurrentUser && response?.events?.includes('databases.*.collections.*.documents.*.create')) {
        // New notification received
        const newNotification = response.payload;
        
        // Add the new notification ID to track it as new
        setNewNotificationIds(prev => new Set([...prev, newNotification.$id]));
        
        // Refresh the notifications list immediately to show the new notification
        fetchNotifications(false);
        
        // Mark as seen in database after 1 second, but keep it visually unseen
        setTimeout(async () => {
          try {
            await markAllNotificationsAsSeen(user.$id);
            // Update the unseen count but don't change visual appearance
            setUnseenCount(0);
            console.log('New notification marked as seen in database after 1 second');
          } catch (error) {
            console.error('Error marking new notification as seen:', error);
          }
        }, 1000);
      } else if (isForCurrentUser) {
        // Other updates, just refresh normally
        fetchNotifications(false);
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user?.$id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handleShowNotification = (notification) => {
    if (notification.type === "application" && notification.jsonData) {
      try {
        const data = JSON.parse(notification.jsonData);
      
        if (data.serviceApplicationId) {
          // Validate the ID format
          if (
            data.serviceApplicationId.length > 36 ||
            !/^[a-zA-Z0-9_]+$/.test(data.serviceApplicationId)
          ) {
            alert(
              "This notification contains an invalid application ID. Please contact support."
            );
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
        alert("Error processing notification data. Please try again.");
      }
    } else if (notification.type === "application_accepted" && notification.jsonData) {
      try {
        const data = JSON.parse(notification.jsonData);
      
        if (data.serviceRequestId) {
          // Validate the ID format
          if (
            data.serviceRequestId.length > 36 ||
            !/^[a-zA-Z0-9_]+$/.test(data.serviceRequestId)
          ) {
            alert(
              "This notification contains an invalid job ID. Please contact support."
            );
            return;
          }

          router.push({
            pathname: "/shared/current-job-details",
            params: { id: data.serviceRequestId },
          });
        } else {
          alert("Job ID not found in notification data.");
        }
      } catch (error) {
        alert("Error processing notification data. Please try again.");
      }
    }
  };

  // Check if notification should appear as unseen visually
  const isVisuallyUnseen = (notification) => {
    // Si l'utilisateur a cliqué "Mark all as seen" → seen
    if (visuallySeenIds.has(notification.$id)) {
      return false;
    }
    
    // Si c'est une nouvelle notification reçue → unseen
    if (newNotificationIds.has(notification.$id)) {
      return true;
    }
    
    // Si ce n'est pas la première visite → seen (car déjà marquées en DB lors d'une visite précédente)
    if (!isFirstVisit) {
      return false;
    }
    
    // Si première visite → garder style unseen
    return true;
  };

  // Count visually unseen notifications for badge
  const visuallyUnseenCount = notifications.filter(isVisuallyUnseen).length;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <GoBackButton />
          <StyledHeading text="Notifications" />
        </View>
        {visuallyUnseenCount > 0 && (
          <View style={styles.badge}>
            <StyledLabel text={visuallyUnseenCount.toString()} color="white" />
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <TouchableOpacity
          onPress={handleMarkAllAsSeen}
          disabled={markingAsSeen || visuallyUnseenCount === 0}
        >
          <StyledLabel
            text={markingAsSeen ? "Marking as seen..." : "Mark all as seen"}
            color={markingAsSeen || visuallyUnseenCount === 0 ? "gray" : "primary"}
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
            const showAsUnseen = isVisuallyUnseen(item);
            return (
              <StyledCard style={showAsUnseen ? styles.unseenCard : null}>
                <View style={styles.titleContainer}>
                  <StyledHeading text={item.title} style={styles.title} />
                  {showAsUnseen && <View style={styles.unseenDot} />}
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
                {item.type === "application_accepted" && (
                  <View style={styles.buttonContainer}>
                    <StyledButton
                      text="Show job"
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
  connectionWarning: {
    backgroundColor: colors.warning + "20",
    padding: 8,
    marginHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    textAlign: "center",
  },
});
