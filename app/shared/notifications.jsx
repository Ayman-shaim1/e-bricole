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
  const [initiallyLoadedIds, setInitiallyLoadedIds] = useState(new Set()); // Track notifications loaded on first visit
  const [initiallyUnseenIds, setInitiallyUnseenIds] = useState(new Set()); // Track notifications that were unseen at initial load
  const [newNotificationIds, setNewNotificationIds] = useState(new Set()); // Track newly received notifications

  const handleMarkAllAsSeen = async () => {
    if (markingAsSeen) return;

    setMarkingAsSeen(true);
    
    // Update visual state - mark all notifications as visually seen
    const allNotificationIds = notifications.map(n => n.$id);
    setVisuallySeenIds(new Set(allNotificationIds));
    
    // Clear tracking sets
    setNewNotificationIds(new Set());
    setInitiallyUnseenIds(new Set());
    
    setMarkingAsSeen(false);
  };

  const fetchNotifications = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    const res = await getNotifications(user.$id);
    if (res.success) {
      setNotifications(res.data);
      
      // If not initial load (i.e., refresh), preserve visual state
      if (!isInitialLoad) {
        // Any notification that is not a new notification should be visually seen
        const shouldBeVisuallySeen = res.data
          .filter(notification => !newNotificationIds.has(notification.$id))
          .map(notification => notification.$id);
        
        setVisuallySeenIds(prev => new Set([...prev, ...shouldBeVisuallySeen]));
      }
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
          
          // Track which notifications were loaded initially
          const initialIds = res.data.map(n => n.$id);
          setInitiallyLoadedIds(new Set(initialIds));
          
          // Check if there are unseen notifications in the database
          const hasUnseenNotifications = res.data.some(notification => !notification.isSeen);
          
          if (hasUnseenNotifications) {
            // Track which notifications were unseen initially
            const unseenNotificationIds = res.data
              .filter(notification => !notification.isSeen)
              .map(notification => notification.$id);
            setInitiallyUnseenIds(new Set(unseenNotificationIds));
            
            // Mark as seen in DB after a delay, but keep them visually unseen initially
            setTimeout(async () => {
              const result = await markAllNotificationsAsSeen(user.$id);
              if (result.success) {
                setUnseenCount(0);
              }
            }, 1000);
            
            // Auto-mark initially unseen notifications as visually seen after 30 seconds
            setTimeout(() => {
              setVisuallySeenIds(prev => new Set([...prev, ...unseenNotificationIds]));
              setInitiallyUnseenIds(new Set());
              console.log('Initially unseen notifications auto-marked as visually seen after 30 seconds');
            }, 30000);
            
            // Mark only the SEEN notifications as visually seen, leave unseen ones for visual display
            const seenNotificationIds = res.data
              .filter(notification => notification.isSeen)
              .map(notification => notification.$id);
            setVisuallySeenIds(new Set(seenNotificationIds));
          } else {
            // All already seen in DB
            setUnseenCount(0);
            // Mark all as visually seen since they're all seen in DB
            setVisuallySeenIds(new Set(initialIds));
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
        
        // Add the new notification to the existing list instead of full refresh
        setNotifications(prev => [newNotification, ...prev]);
        
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

        // Auto-mark as visually seen after 30 seconds (visual only, not database)
        setTimeout(() => {
          setVisuallySeenIds(prev => new Set([...prev, newNotification.$id]));
          setNewNotificationIds(prev => {
            const updated = new Set(prev);
            updated.delete(newNotification.$id);
            return updated;
          });
          console.log('New notification auto-marked as visually seen after 30 seconds');
        }, 30000);
      } else if (isForCurrentUser) {
        // Other updates, refresh normally but preserve visual state
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
    // If user clicked "Mark all as seen" → seen
    if (visuallySeenIds.has(notification.$id)) {
      return false;
    }
    
    // If it's a newly received notification → unseen
    if (newNotificationIds.has(notification.$id)) {
      return true;
    }
    
    // If it was unseen at initial load → unseen (until user marks as seen)
    if (initiallyUnseenIds.has(notification.$id)) {
      return true;
    }
    
    // All other notifications are seen by default
    return false;
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
