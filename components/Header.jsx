import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../constants/colors";
import StyledHeading from "./StyledHeading";
import { useAuth } from "../context/AuthContext";
import StyledAddressPicker from "./StyledAddressPicker";
import useGeolocation from "../hooks/useGeolocation";

export default function Header() {
  const { user } = useAuth();
  const { location, error, isLoading } = useGeolocation();

  const [pickedLocation, setPickerLocation] = useState(null);

  const handlePickAddress = (newPosition) => {
    setPickerLocation({
      latitude: newPosition?.latitude,
      longitude: newPosition?.longitude,
    });
  };

  useEffect(() => {
    if (location) {
      setPickerLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [location]);

  return (
    <View style={styles.headerContent}>
      <View style={styles.userInfo}>
        <View style={styles.userInfoTop}>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image
              source={
                user?.profileImage
                  ? { uri: user.profileImage }
                  : require("../assets/icons/default_user.png")
              }
              style={styles.avatar}
              onError={(error) => {
                console.log("Error loading profile image:", error);
              }}
              defaultSource={require("../assets/icons/default_user.png")}
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
            />
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.notificationButton}>
        <View style={styles.notificationIconContainer}>
          <Ionicons name="notifications" size={24} color={colors.primary} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>2</Text>
          </View>
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
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: 5,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 22.5,
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
