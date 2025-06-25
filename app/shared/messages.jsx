import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Text,
} from "react-native";
import ThemedView from "../../components/ThemedView";
import StyledCard from "../../components/StyledCard";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function MessagesScreen() {
  const { user } = useAuth();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Elegant mock data
  const mockMessages = [
    {
      id: "1",
      name: "Alexander Chen",
      message:
        "The renovation work exceeded my expectations. Thank you for your attention to detail.",
      time: "10:30",
      unread: 2,
      online: true,
      profession: "Interior Designer",
    },
    {
      id: "2",
      name: "Isabella Rodriguez",
      message:
        "When would you be available for the kitchen remodeling project?",
      time: "09:15",
      unread: 0,
      online: false,
      profession: "Homeowner",
    },
    {
      id: "3",
      name: "Marcus Thompson",
      message:
        "Your craftsmanship is exceptional. The bathroom looks stunning!",
      time: "Yesterday",
      unread: 0,
      online: true,
      profession: "Property Manager",
    },
    {
      id: "4",
      name: "Sophia Williams",
      message:
        "Could you provide a detailed quote for the living room project?",
      time: "2 days ago",
      unread: 1,
      online: false,
      profession: "Architect",
    },
  ];

  const fetchMessages = async () => {
    setLoading(true);
    setTimeout(() => {
      setMessages(mockMessages);
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleMessagePress = (message) => {
    // Navigate to conversation screen with the selected conversation
    router.push({
      pathname: "/shared/conversation",
      params: { 
        name: message.name,
        profession: message.profession,
        online: message.online.toString()
      }
    });
  };

  const renderMessageItem = ({ item }) => (
    <StyledCard
      style={styles.messageCard}
      onPress={() => handleMessagePress(item)}
    >
      <View style={styles.messageContent}>
        <View style={styles.avatarContainer}>
          <Avatar size="md" text={item.name} style={styles.avatar} />
          {item.online && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.nameContainer}>
              <Text style={[styles.name, { color: theme.textColor }]}>
                {item.name}
              </Text>
              <Text
                style={[styles.profession, { color: theme.textColorSecondary }]}
              >
                {item.profession}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              <Text style={[styles.time, { color: theme.textColorSecondary }]}>
                {item.time}
              </Text>
              {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {item.unread > 99 ? "99+" : item.unread}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text
            style={[
              styles.message,
              { color: theme.textColorSecondary },
              item.unread > 0 && {
                color: theme.textColor,
                fontFamily: "Poppins-Medium",
              },
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
        </View>
      </View>
    </StyledCard>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.textColor }]}>
            Messages
          </Text>
          <Text style={[styles.subtitle, { color: theme.textColorSecondary }]}>
            Your conversations
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.textColorSecondary }]}
          >
            Loading conversations...
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.textColor }]}>Messages</Text>
        <Text style={[styles.subtitle, { color: theme.textColorSecondary }]}>
          {messages.length} conversation{messages.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[styles.emptyIcon, { backgroundColor: theme.cardColor }]}
          >
            <Text style={styles.emptyIconText}>💬</Text>
          </View>
          <Text style={[styles.emptyText, { color: theme.textColor }]}>
            No conversations yet
          </Text>
          <Text
            style={[styles.emptySubtext, { color: theme.textColorSecondary }]}
          >
            Start connecting with clients and artisans
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 8,
  },
  messageCard: {
    marginTop: 8,
    marginHorizontal: 4,
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 17,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 2,
  },
  profession: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
  },
  timeContainer: {
    alignItems: "flex-end",
  },
  time: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    marginBottom: 4,
  },
  message: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    lineHeight: 22,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
});
