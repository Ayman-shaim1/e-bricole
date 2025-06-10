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
import GoBackButton from "../../components/GoBackButton";
import StyledCard from "../../components/StyledCard";
import Divider from "../../components/Divider";
import StyledLabel from "../../components/StyledLabel";
import { colors } from "../../constants/colors";

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
        {unseenCount > 0 ? (
          <View style={styles.badge}>
            <StyledHeading
              text={unseenCount.toString()}
              style={{ color: colors.white, fontSize: 12 }}
            />
          </View>
        ) : (
          ""
        )}
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
            <StyledCard>
              <StyledHeading text={item.title} style={styles.title} />
              <StyledText text={item.messageContent} style={styles.content} />
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
    marginBottom: 10,
    justifyContent: "space-between",
  },
  title: { fontSize: 16, fontWeight: "bold" },
  content: { marginTop: 4, fontSize: 14 },
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
