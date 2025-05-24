import {
  StyleSheet,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import React, { useState } from "react";
import ThemedView from "../../components/ThemedView";
import StyledCard from "../../components/StyledCard";
import StyledLabel from "../../components/StyledLabel";
import StyledButton from "../../components/StyledButton";
import { colors } from "../../constants/colors";
import Ionicons from "react-native-vector-icons/Ionicons";
import StyledHeading from "../../components/StyledHeading";
import { useRouter } from "expo-router";
import { logoutUser } from "../../services/authService";
import { useTheme } from "../../context/ThemeContext";

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { theme, changeTheme } = useTheme();
  const router = useRouter();

  // Dummy handler functions
  const handleEditProfile = () => {
    console.log("Navigate to Edit Profile");
    // Navigation logic here
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled((previousState) => !previousState);
    console.log("Notifications enabled:", !notificationsEnabled);
    // Logic to update notification settings
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  };

  const handleLogout = async () => {
    try {
      const result = await logoutUser();
      if (result.success) {
        router.replace("/login");
      } else {
        Alert.alert(
          "Logout Failed",
          result.error || "Failed to logout. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  // Helper component for a single settings item row
  const SettingItem = ({
    iconName,
    label,
    onPress,
    isSwitch = false,
    switchValue,
    onSwitchChange,
    isLast = false,
    value,
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, isLast && styles.noBorderBottom]}
      onPress={onPress}
      disabled={isSwitch} // Disable touch feedback for switch items
    >
      <View style={styles.settingLeft}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={24}
            color={colors.darkGray}
            style={styles.settingIcon}
          />
        )}
        <StyledLabel text={label} style={styles.settingLabel} />
      </View>

      <View style={styles.settingRight}>
        {isSwitch ? (
          <Switch
            trackColor={{ false: colors.gray, true: colors.primary }}
            thumbColor={switchValue ? colors.white : colors.white}
            onValueChange={onSwitchChange}
            value={switchValue}
          />
        ) : (
          onPress && (
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
          )
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <StyledCard style={styles.card}>
          <StyledHeading text="Account" style={styles.sectionHeader} />
          <SettingItem
            iconName="person-outline"
            label="Edit profile"
            onPress={handleEditProfile}
          />
          <SettingItem
            iconName="lock-closed-outline"
            label="Change password"
            onPress={() => console.log("Pressed: Change password")}
            isLast={true}
          />
        </StyledCard>

        <StyledCard style={styles.card}>
          <StyledHeading text="Notifications" style={styles.sectionHeader} />
          <SettingItem
            iconName="notifications-outline"
            label="App notification"
            isSwitch={true}
            switchValue={notificationsEnabled}
            onSwitchChange={handleToggleNotifications}
            isLast={true}
          />
        </StyledCard>

        <StyledCard style={styles.card}>
          <StyledHeading text="More" style={styles.sectionHeader} />
          <SettingItem
            iconName="language"
            label="Language & Country"
            onPress={() => console.log("Pressed: Language ")}
          />

          <SettingItem
            iconName={theme === 'dark' ? "moon-outline" : "sunny-outline"}
            label={theme === 'dark' ? "Dark Mode" : "Light Mode"}
            isSwitch={true}
            switchValue={theme === 'dark'}
            onSwitchChange={handleThemeToggle}
          />

          <SettingItem
            iconName="information-circle-outline"
            label="Help & Support"
            onPress={() => console.log("Pressed: Help & Support")}
            isLast={true}
          />
        </StyledCard>

        <StyledButton
          text="Sign Out"
          onPress={handleLogout}
          color="danger"
          icon={
            <Ionicons name="log-out-outline" size={24} color={colors.white} />
          }
          style={styles.signOutButton}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.black,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  card: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 8,
    color: colors.darkGray,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  noBorderBottom: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.black,
  },
  settingRight: {
    flexDirection: "row",
  },
  signOutButton: {
    marginTop: 25,
    alignItems: "center",
  },
});
