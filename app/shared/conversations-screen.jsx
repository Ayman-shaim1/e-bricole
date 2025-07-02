import React, { useEffect, useState, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import ConversationItem from "../../components/ConversationItem";
import { useAuth } from "../../context/AuthContext";
import { useBadge } from "../../context/BadgeContext";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import StyledTextInput from "../../components/StyledTextInput";
import Divider from "../../components/Divider";
import { getUserConversations } from "../../services/messagesService";
import { subscribeToMessages } from "../../services/realtimeService";

export default function ConversationsScreen() {
  const { user } = useAuth();
  const { updateCurrentScreen, refreshBadgeCounts } = useBadge();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [error, setError] = useState(null);
  
  const realtimeUnsubscribe = useRef(null);

  // Initial load of conversations
  const fetchConversations = async () => {
    if (!user?.$id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await getUserConversations(user.$id);
      
      if (result.success) {
        setConversations(result.data);
        // Refresh badge counts after loading conversations
        refreshBadgeCounts();
      } else {
        setError(result.error);
        setConversations([]);
      }
    } catch (err) {
      setError("Failed to load conversations. Please try again.");
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle realtime updates
  const handleRealtimeUpdate = async (response) => {
    if (!response.payload || !user?.$id) return;

    // Simply refresh conversations when any message update occurs
    const result = await getUserConversations(user.$id);
    if (result.success) {
      setConversations(result.data);
    }
  };

  // Setup
  useEffect(() => {
    // Update current screen for badge management
    updateCurrentScreen('conversations');
    
    fetchConversations();
    
    if (user?.$id) {
      realtimeUnsubscribe.current = subscribeToMessages(user.$id, handleRealtimeUpdate);
    }

    return () => {
      if (realtimeUnsubscribe.current) {
        realtimeUnsubscribe.current();
      }
    };
  }, [user?.$id]);

  // Filter conversations
  useEffect(() => {
    if (!search.trim()) {
      setFilteredConversations(conversations);
    } else {
      setFilteredConversations(
        conversations.filter((conversation) =>
          (conversation.name || "").toLowerCase().includes(search.trim().toLowerCase())
        )
      );
    }
  }, [search, conversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleMessagePress = (conversation) => {
    router.push({
      pathname: "/shared/messages-screen",
      params: {
        name: conversation.name,
        profession: conversation.profession,
        online: conversation.online.toString(),
        otherUserId: conversation.id,
      },
    });
  };

  const renderConversationItem = ({ item }) => (
    <ConversationItem 
      conversation={item} 
      onPress={handleMessagePress} 
    />
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

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.textColor }]}>Messages</Text>
          <Text style={[styles.subtitle, { color: theme.textColorSecondary || theme.textColor + "80" }]}>Error loading conversations</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.cardColor || '#F5F5F5' }]}> 
            <Ionicons name="alert-circle-outline" size={40} color={colors.error || '#FF6B6B'} />
          </View>
          <Text style={[styles.emptyText, { color: theme.textColor || '#757575' }]}>
            Failed to load conversations
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textColorSecondary || '#9E9E9E' }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.textColor }]}>Messages</Text>
        <Text style={[styles.subtitle, { color: theme.textColorSecondary || theme.textColor + "80" }]}>
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </Text>
      </View>
      <StyledTextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search conversations..."
        style={[styles.searchInput, { backgroundColor: theme.textInputBg }]}
        placeholderTextColor={theme.placeholderColor}
      />
      <Divider style={[styles.divider, { backgroundColor: theme.navBackgroundColor }]} />
      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.cardColor || '#F5F5F5' }]}> 
            <Ionicons name="chatbubbles-outline" size={40} color={theme.textColorSecondary || '#9E9E9E'} />
          </View>
          <Text style={[styles.emptyText, { color: theme.textColor || '#757575' }]}>
            {search.trim() ? "No matching conversations" : "No messages yet"}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textColorSecondary || '#9E9E9E' }]}>
            {search.trim() 
              ? "Try a different search term or browse all conversations" 
              : "Your conversations will appear here when you start chatting"
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
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
