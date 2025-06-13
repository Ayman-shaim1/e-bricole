import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../constants/colors";
import StyledHeading from "./StyledHeading";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import StyledAddressPicker from "./StyledAddressPicker";
import useGeolocation from "../hooks/useGeolocation";
import Avatar from "./Avatar";
import { useRouter } from "expo-router";
import { getUnseenNotificationCount } from "../services/notificationService";
import { subscribeToNotifications } from "../services/realtimeService";
import { useFocusEffect } from "@react-navigation/native";

export default function Header() {
  const { user } = useAuth();
  const { location, error, isLoading } = useGeolocation();
  const [pickedLocation, setPickerLocation] = useState(null);
  const { unseenCount, setUnseenCount } = useNotifications();
  const router = useRouter();

  const handlePickAddress = (locationData) => {
    if (locationData.coordinates) {
      setPickerLocation({
        latitude: locationData.coordinates.latitude,
        longitude: locationData.coordinates.longitude,
      });
    } else if (locationData.latitude && locationData.longitude) {
      setPickerLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });
    }
  };

  useEffect(() => {
    if (location) {
      setPickerLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [location]);

  useEffect(() => {
    if (user?.$id) {
      // Initial count fetch
      getUnseenNotificationCount(user.$id).then(setUnseenCount);

      // Subscribe to realtime updates
      const unsubscribe = subscribeToNotifications(
        user.$id,
        () => {}, // We don't need to handle the notification here
        (prevCount) => setUnseenCount(prevCount) // Update count when new notification arrives
      );

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  // Update count when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.$id) {
        getUnseenNotificationCount(user.$id).then(setUnseenCount);
      }
    }, [user])
  );

  return (
    <View style={styles.headerContent}>
      <View style={styles.userInfo}>
        <View style={styles.userInfoTop}>
          <TouchableOpacity style={styles.avatarContainer}>
            <Avatar
              size="md"
              source={user?.profileImage}
              text={user?.name}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View>
            <StyledHeading text={user?.name} style={styles.userName} />
            <StyledAddressPicker
              useLabel={true}
              coordinates={pickedLocation}
              error={error}
              isLoading={isLoading}
              onPick={handlePickAddress}
              shouldPick={false}
            />
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/shared/notifications')}>
        <View style={styles.notificationIconContainer}>
          <Ionicons name="notifications" size={24} color={colors.primary} />
          {unseenCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>{unseenCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: 16,
    paddingTop: Platform.OS === "android" ? 16 : 40,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userInfoTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    marginTop: 5,
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.black,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    marginRight: 1,
  },
  position: {
    fontSize: 14,
    color: colors.darkGray,
  },
  notificationButton: {
    padding: 8,
    marginLeft: 8,
  },
  notificationIconContainer: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationCount: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
});
