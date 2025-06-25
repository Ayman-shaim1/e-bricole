import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
} from "react-native";
import ThemedView from "../../components/ThemedView";
import ConversationItem from "../../components/ConversationItem";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import StyledTextInput from "../../components/StyledTextInput";
import Divider from "../../components/Divider";

export default function ConversationsScreen() {
  const { user } = useAuth();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);

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
      isOutgoing: true,
      isSeen: false,
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
      isOutgoing: true,
      isSeen: true,
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
      isOutgoing: true,
      isSeen: true,
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
      isOutgoing: false,
      isSeen: true,
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

  useEffect(() => {
    if (!search.trim()) {
      setFilteredMessages(messages);
    } else {
      setFilteredMessages(
        messages.filter((msg) =>
          (msg.name || "").toLowerCase().includes(search.trim().toLowerCase())
        )
      );
    }
  }, [search, messages]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleMessagePress = (conversation) => {
    // Navigate to conversation screen with the selected conversation
    router.push({
      pathname: "/shared/messages-screen",
      params: {
        name: conversation.name,
        profession: conversation.profession,
        online: conversation.online.toString(),
      },
    });
  };

  const renderMessageItem = ({ item }) => (
    <ConversationItem conversation={item} onPress={handleMessagePress} />
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.textColor }]}>Messages</Text>
          <Text style={[styles.subtitle, { color: theme.textColorSecondary || theme.textColor + "80" }]}>Your conversations</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: theme.textColorSecondary || theme.textColor + "80" }]}>Loading conversations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.textColor }]}>Messages</Text>
        <Text style={[styles.subtitle, { color: theme.textColorSecondary || theme.textColor + "80" }]}> {messages.length} conversation{messages.length !== 1 ? "s" : ""} </Text>
      </View>
      <StyledTextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search client..."
        style={[styles.searchInput, { backgroundColor: theme.textInputBg }]}
        placeholderTextColor={theme.placeholderColor}
      />
      <Divider style={[styles.divider, { backgroundColor: theme.navBackgroundColor }]} />
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.cardColor }]}> 
            <Text style={styles.emptyIconText}>💬</Text> 
          </View>
          <Text style={[styles.emptyText, { color: theme.textColor }]}>No conversations yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.textColorSecondary || theme.textColor + "80" }]}>Start connecting with clients and artisans</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
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
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.backgroundColor }]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  headerContainer: {
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
  searchInput: {
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
  divider: {
    marginBottom: 16,
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
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
});
