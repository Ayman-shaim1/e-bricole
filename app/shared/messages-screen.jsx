import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import StyledTextInput from "../../components/StyledTextInput";
import StyledText from "../../components/StyledText";
import StyledLabel from "../../components/StyledLabel";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import GoBackButton from "../../components/GoBackButton";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { getMessagesBetweenUsers, sendMessage as sendMessageToDb, markConversationAsRead, markAllReceivedMessagesAsRead } from "../../services/messagesService";
import { getUserById } from "../../services/userService";
import { client } from "../../config/appwrite";
import settings from "../../config/settings";
  
const formatTime = (dateString) => {
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function MessagesScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherUserData, setOtherUserData] = useState(null);
  const flatListRef = useRef(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const realtimeUnsubscribe = useRef(null);
  const hasMarkedAsRead = useRef(false);

  // Parse conversation data from params
  const conversation = {
    name: params.name || "Unknown",
    profession: params.profession || "",
    online: params.online === "true",
    otherUserId: params.otherUserId,
  };

  // Load other user data
  const loadOtherUserData = async () => {
    if (!conversation.otherUserId) return;

    try {
      const result = await getUserById(conversation.otherUserId);
      if (result.success && result.user) {
        setOtherUserData(result.user);
      }
    } catch (error) {
      console.error("Error loading other user data:", error);
    }
  };

  // Mark all received messages as read when entering the screen for the first time
  const markAllAsReadOnEntry = async () => {
    if (!user?.$id || hasMarkedAsRead.current) return;

    try {
      const result = await markAllReceivedMessagesAsRead(user.$id);
      if (result.success) {
        hasMarkedAsRead.current = true;
      }
    } catch (error) {
      console.error("Error marking all messages as read:", error);
    }
  };

  // Load messages from database
  const loadMessages = async () => {
    if (!user?.$id || !conversation.otherUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getMessagesBetweenUsers(user.$id, conversation.otherUserId);
      
      if (result.success) {
        // Transform database messages to component format
        const transformedMessages = result.data.map(msg => {
          const senderUserId = typeof msg.senderUser === 'string' 
            ? msg.senderUser 
            : msg.senderUser?.$id;
          
          // Get sender user data (name and profile image)
          const senderUserData = typeof msg.senderUser === 'object' 
            ? msg.senderUser 
            : null;
          
          return {
            id: msg.$id,
            text: msg.messageContent,
            sender: senderUserId === user.$id ? "me" : "them",
            timestamp: msg.$createdAt,
            isOutgoing: senderUserId === user.$id,
            isSeen: msg.isSeen || false,
            type: msg.type,
            senderUserData: senderUserData, // Add sender user data for each message
          };
        });
        
        setMessages(transformedMessages);
        
        // Mark conversation as read
        if (transformedMessages.length > 0) {
          await markConversationAsRead(user.$id, conversation.otherUserId);
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    loadOtherUserData();
    markAllAsReadOnEntry(); // Mark all received messages as read on first entry
    
    // Setup real-time subscription directly with Appwrite
    if (user?.$id && conversation.otherUserId) {
      const channel = `databases.${settings.dataBaseId}.collections.${settings.messageId}.documents`;
      
      const unsubscribe = client.subscribe(
        channel,
        (response) => {
          // Handle real-time message updates
          if (response.payload && user?.$id) {
            const message = response.payload;
            const senderUserId = typeof message.senderUser === 'string' 
              ? message.senderUser 
              : message.senderUser?.$id;
            const receiverUserId = typeof message.receiverUser === 'string' 
              ? message.receiverUser 
              : message.receiverUser?.$id;

            // Check if this message is relevant to current conversation
            if ((senderUserId === user.$id && receiverUserId === conversation.otherUserId) ||
                (senderUserId === conversation.otherUserId && receiverUserId === user.$id)) {
              
              // Transform and add the new message to state
              const newMessage = {
                id: message.$id,
                text: message.messageContent,
                sender: senderUserId === user.$id ? "me" : "them",
                timestamp: message.$createdAt,
                isOutgoing: senderUserId === user.$id,
                isSeen: message.isSeen || false,
                type: message.type,
              };

              // Update messages state - avoid duplicates
              setMessages(prev => {
                // Check if message already exists
                const messageExists = prev.some(msg => msg.id === newMessage.id);
                if (messageExists) {
                  // Update existing message
                  return prev.map(msg => 
                    msg.id === newMessage.id ? newMessage : msg
                  );
                } else {
                  // Add new message
                  return [...prev, newMessage];
                }
              });

              // Mark as read if it's an incoming message
              if (senderUserId === conversation.otherUserId) {
                markConversationAsRead(user.$id, conversation.otherUserId);
              }

              // Auto-scroll to bottom
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }
        },
        (error) => {
          console.error("Real-time subscription error:", error);
        }
      );

      realtimeUnsubscribe.current = unsubscribe;
    }

    return () => {
      if (realtimeUnsubscribe.current) {
        realtimeUnsubscribe.current();
      }
    };
  }, [user?.$id, conversation.otherUserId]);

  // Scroll to bottom when messages are loaded
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (message.trim() && user?.$id && conversation.otherUserId) {
      const messageText = message.trim();
      setMessage("");

      try {
        // Send message to database
        const result = await sendMessageToDb({
          senderUser: user.$id,
          receiverUser: conversation.otherUserId,
          type: "chat",
          messageContent: messageText,
        });

        if (result.success) {
          // Don't add message optimistically - let real-time handle it
          // Just scroll to bottom when we know message was sent
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send message. Please try again.");
      }
    }
  };

  // Function to add info messages
  const addInfoMessage = (text) => {
    const animatedValue = new Animated.Value(0);
    const scaleValue = new Animated.Value(0.3);
    
    const infoMessage = {
      id: Date.now().toString(),
      text: text,
      sender: "info",
      timestamp: new Date().toISOString(),
      isOutgoing: false,
      isSeen: true,
      animatedValue: animatedValue,
      scaleValue: scaleValue,
      isNew: true,
      type: "info",
    };
    
    setMessages((prev) => [...prev, infoMessage]);

    // Start the elegant appearance animation (using native driver for transforms)
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(animatedValue, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Remove the isNew flag after animation
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === infoMessage.id ? { ...msg, isNew: false } : msg
          )
        );
      });
    }, 50);

    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Function to clear all messages
  const clearAllMessages = () => {
    setShowHeaderMenu(false);
    
    Alert.alert(
      "Clear all messages",
      "Are you sure you want to delete all messages in this conversation? Info messages will be preserved.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear all",
          style: "destructive",
          onPress: () => {
            // Get only regular messages (not info messages) for animation
            const regularMessages = messages.filter(msg => msg.type !== "info");
            const infoMessages = messages.filter(msg => msg.type === "info");
            
            if (regularMessages.length === 0) {
              // No regular messages to delete
              return;
            }

            // Animate only regular messages out before clearing
            const animatedMessages = regularMessages.map(msg => ({
              ...msg,
              isDeleting: true,
              animatedValue: new Animated.Value(1),
              scaleValue: new Animated.Value(1),
            }));
            
            // Update state with animated regular messages + unchanged info messages
            setMessages([...animatedMessages, ...infoMessages]);

            // Start batch deletion animation for regular messages only
            const animations = animatedMessages.map(msg => 
              Animated.parallel([
                Animated.timing(msg.animatedValue, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(msg.scaleValue, {
                  toValue: 0.3,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ])
            );

            Animated.stagger(50, animations).start(() => {
              // Keep only info messages after animation
              setMessages(infoMessages);
            });
          },
        },
      ]
    );
  };

  // Handle long press to delete message
  const handleLongPress = (message) => {
    // Don't allow deletion of info messages
    if (message.type === "info") {
      return;
    }

    Alert.alert(
      "Supprimer le message",
      "Êtes-vous sûr de vouloir supprimer ce message ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            // Create animated values - only for native driver supported properties
            const animatedValue = new Animated.Value(1);
            const scaleValue = new Animated.Value(1);
            
            // Mark message for deletion
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === message.id
                  ? { 
                      ...msg, 
                      isDeleting: true, 
                      animatedValue: animatedValue,
                      scaleValue: scaleValue
                    }
                  : msg
              )
            );

            // Start the elegant deletion animation (all with native driver)
            Animated.sequence([
              // First: slight scale up (attention grabbing)
              Animated.timing(scaleValue, {
                toValue: 1.1,
                duration: 150,
                useNativeDriver: true,
              }),
              // Then: smooth deletion with spring animation
              Animated.parallel([
                Animated.spring(animatedValue, {
                  toValue: 0,
                  tension: 80,
                  friction: 6,
                  useNativeDriver: true,
                }),
                Animated.spring(scaleValue, {
                  toValue: 0.3,
                  tension: 80,
                  friction: 6,
                  useNativeDriver: true,
                }),
              ]),
            ]).start(() => {
              // Remove the message after animation completes
              setMessages((prevMessages) =>
                prevMessages.filter((msg) => msg.id !== message.id)
              );
            });
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender === "me";
    const isInfoMessage = item.type === "info";
    
    // Get theme-appropriate colors for info messages
    const isDarkTheme = theme.backgroundColor === "#1A1A1A"; // Check if dark theme
    const infoBgColor = isDarkTheme ? "#1C2B3D" : colors.accentLight3; // Dark blue-gray for dark mode
    const infoBorderColor = isDarkTheme ? colors.accentLight1 : colors.accentLight2;
    const infoTextColor = isDarkTheme ? colors.accentLight1 : colors.primary;
    const infoTimeColor = isDarkTheme ? colors.accentLight2 : colors.accentLight1;

    const renderReadStatus = () => {
      if (isMyMessage) {
        if (item.isSeen) {
          return (
            <View style={styles.readStatusContainer}>
              <View style={styles.seenIconContainer}>
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color={colors.success}
                />
              </View>
            </View>
          );
        } else {
          return (
            <View style={styles.readStatusContainer}>
              <View style={styles.sentIconContainer}>
                <Ionicons 
                  name="checkmark" 
                  size={16} 
                  color={isMyMessage ? colors.white + "90" : theme.textColorSecondary} 
                />
              </View>
            </View>
          );
        }
      }
      return null;
    };

    // Render info message differently
    if (isInfoMessage) {
      return (
        <Animated.View
          style={[
            styles.infoMessageContainer,
            item.isDeleting && {
              opacity: item.animatedValue,
              transform: [
                {
                  scale: item.scaleValue || 1,
                },
                {
                  translateY: item.animatedValue ? item.animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }) : 0,
                },
              ],
            },
            item.isNew && item.animatedValue && {
              opacity: item.animatedValue,
              transform: [
                {
                  translateY: item.animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 0],
                  }),
                },
                {
                  scale: item.scaleValue || item.animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.infoMessageBubble,
              {
                backgroundColor: infoBgColor,
                borderColor: infoBorderColor,
              }
            ]}
            onLongPress={() => handleLongPress(item)}
          >
            <StyledLabel
              text={item.text}
              style={[
                styles.infoMessageText,
                { color: infoTextColor }
              ]}
            />
            <StyledLabel
              text={formatTime(item.timestamp)}
              style={[
                styles.infoMessageTime,
                { color: infoTimeColor }
              ]}
            />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isMyMessage
            ? styles.myMessageContainer
            : styles.theirMessageContainer,
          item.isDeleting && {
            opacity: item.animatedValue,
            transform: [
              {
                translateX: item.animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [isMyMessage ? 100 : -100, 0],
                }),
              },
              {
                scale: item.scaleValue || 1,
              },
            ],
          },
          item.isNew && item.animatedValue && {
            opacity: item.animatedValue,
            transform: [
              {
                translateX: item.animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [isMyMessage ? 50 : -50, 0],
                }),
              },
              {
                scale: item.scaleValue || item.animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
              {
                translateY: item.animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {!isMyMessage && (
          <Avatar
            size="sm"
            text={item.senderUserData?.name || otherUserData?.name || conversation.name}
            source={item.senderUserData?.profileImage || otherUserData?.profileImage}
            style={styles.messageAvatar}
          />
        )}
        <TouchableOpacity
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            {
              backgroundColor: isMyMessage ? colors.primary : theme.cardColor,
            },
          ]}
          onLongPress={() => handleLongPress(item)}
        >
          <StyledText
            text={item.text}
            color={isMyMessage ? "white" : undefined}
            style={styles.messageText}
          />
          <View style={styles.messageFooter}>
            {renderReadStatus()}
            <StyledLabel
              text={formatTime(item.timestamp)}
              color={isMyMessage ? "white" : undefined}
              style={[
                styles.messageTime,
                {
                  color: isMyMessage
                    ? colors.white + "80"
                    : theme.textColorSecondary || theme.textColor + "80",
                },
              ]}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.headerColor,
            borderBottomColor: theme.navBackgroundColor,
          },
        ]}
      >
        <GoBackButton />
        <View style={styles.headerInfo}>
          <Avatar
            size="sm"
            text={otherUserData?.name || conversation.name}
            source={otherUserData?.profileImage}
            style={styles.messageAvatar}
          />
          <View>
            <StyledText
              text={otherUserData?.name || conversation.name}
              style={[styles.headerTitle, { color: theme.textColor }]}
            />
            <StyledLabel
              text={otherUserData?.serviceType?.title || otherUserData?.profession || conversation.profession}
              style={[
                styles.headerSubtitle,
                { color: theme.textColorSecondary || theme.textColor + "80" },
              ]}
            />
          </View>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowHeaderMenu(true)}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={theme.textColor}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Animated.View style={styles.loadingDots}>
              <StyledText text="Loading messages..." style={{ color: theme.textColorSecondary }} />
            </Animated.View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            style={{
              backgroundColor: theme.backgroundColor,
              paddingVertical: 15,
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <StyledText 
                  text="No messages yet" 
                  style={[styles.emptyText, { color: theme.textColorSecondary }]} 
                />
                <StyledText 
                  text="Start the conversation by sending a message" 
                  style={[styles.emptySubtext, { color: theme.textColorSecondary }]} 
                />
              </View>
            )}
          />
        )}

        <View
          style={[styles.inputContainer, { backgroundColor: theme.cardColor }]}
        >
          <StyledTextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            multiline
            maxLength={500}
            style={[styles.textInput, { backgroundColor: theme.textInputBg }]}
            placeholderTextColor={theme.placeholderColor}
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: message.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Simple Dropdown Menu */}
      {showHeaderMenu && (
        <>
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            onPress={() => setShowHeaderMenu(false)}
          />
          <View style={[styles.dropdownMenu, { backgroundColor: theme.cardColor }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={clearAllMessages}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.danger}
                style={styles.dropdownIcon}
              />
              <StyledLabel
                text="Clear all messages"
                style={[styles.dropdownText, { color: colors.danger }]}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    paddingTop: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  myMessageBubble: {
    borderBottomRightRadius: 6,
  },
  theirMessageBubble: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    lineHeight: 22,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    alignSelf: "flex-end",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  readStatusContainer: {
    marginRight: 6,
    marginLeft: 4,
  },
  seenIconContainer: {
    backgroundColor: colors.success + '20',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    width: "100%",
    height: 90,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 32,
    paddingLeft: 20,
    paddingRight: 50,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  infoMessageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  infoMessageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    maxWidth: "85%",
    borderWidth: 1,
  },
  infoMessageText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  infoMessageTime: {
    fontSize: 10,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    marginTop: 4,
  },
  menuButton: {
    marginLeft: 16,
  },
  dropdownBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  dropdownMenu: {
    position: "absolute",
    top: 85,
    right: 16,
    width: 200,
    borderRadius: 8,
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingDots: {
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
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
});
