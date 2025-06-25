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
  
const formatTime = (dateString) => {
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function MessagesScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const flatListRef = useRef(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Parse conversation data from params
  const conversation = {
    name: params.name || "Unknown",
    profession: params.profession || "",
    online: params.online === "true",
  };

  // Fake conversation data based on the selected conversation
  const fakeConversations = {
    "Alexander Chen": [
      {
        id: "1",
        text: "Hi! I'm interested in your renovation services.",
        sender: "them",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        isOutgoing: false,
        isSeen: true,
      },
      {
        id: "2",
        text: "Hello! Thank you for reaching out. I'd be happy to help with your renovation project.",
        sender: "me",
        timestamp: new Date(Date.now() - 82800000).toISOString(),
        isOutgoing: true,
        isSeen: true,
      },
      {
        id: "info1",
        text: "Application submitted and under review",
        sender: "info",
        timestamp: new Date(Date.now() - 79200000).toISOString(),
        isOutgoing: false,
        isSeen: true,
        type: "info",
      },
      {
        id: "3",
        text: "Great! I have a 3-bedroom apartment that needs a complete renovation.",
        sender: "them",
        timestamp: new Date(Date.now() - 75600000).toISOString(),
        isOutgoing: false,
        isSeen: true,
      },
      {
        id: "4",
        text: "That sounds like an exciting project! When would you like me to come and take a look?",
        sender: "me",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        isOutgoing: true,
        isSeen: true,
      },
      {
        id: "info2",
        text: "Payment received for the project",
        sender: "info",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isOutgoing: false,
        isSeen: true,
        type: "info",
      },
      {
        id: "5",
        text: "The renovation work exceeded my expectations. Thank you for your attention to detail.",
        sender: "them",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        isOutgoing: false,
        isSeen: true,
      },
    ],
    "Isabella Rodriguez": [
      {
        id: "1",
        text: "Hi there! I need help with kitchen remodeling.",
        sender: "them",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        isOutgoing: false,
        isSeen: true,
      },
      {
        id: "2",
        text: "Hello Isabella! I'd love to help with your kitchen project. What's your vision?",
        sender: "me",
        timestamp: new Date(Date.now() - 169200000).toISOString(),
        isOutgoing: true,
        isSeen: false,
      },
      {
        id: "info1",
        text: "Job status: In progress",
        sender: "info",
        timestamp: new Date(Date.now() - 165600000).toISOString(),
        isOutgoing: false,
        isSeen: true,
        type: "info",
      },
      {
        id: "3",
        text: "I want a modern, open-concept kitchen with an island.",
        sender: "them",
        timestamp: new Date(Date.now() - 162000000).toISOString(),
        isOutgoing: false,
        isSeen: true,
      },
      {
        id: "4",
        text: "Perfect! When can I come and see the space?",
        sender: "me",
        timestamp: new Date(Date.now() - 158400000).toISOString(),
        isOutgoing: true,
        isSeen: true,
      },
      {
        id: "info2",
        text: "Meeting scheduled for tomorrow at 2 PM",
        sender: "info",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        isOutgoing: false,
        isSeen: true,
        type: "info",
      },
    ],
    "Marcus Thompson": [
      {
        id: "1",
        text: "Hello! I need electrical work done in my office building.",
        sender: "them",
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        isOutgoing: false,
        isSeen: true,
      },
      {
        id: "2",
        text: "Hi Marcus! I can definitely help with electrical work. What's the scope?",
        sender: "me",
        timestamp: new Date(Date.now() - 255600000).toISOString(),
        isOutgoing: true,
        isSeen: true,
      },
      {
        id: "info1",
        text: "New message from the client",
        sender: "info",
        timestamp: new Date(Date.now() - 252000000).toISOString(),
        isOutgoing: false,
        isSeen: true,
        type: "info",
      },
      {
        id: "3",
        text: "We need new lighting fixtures and some rewiring.",
        sender: "them",
        timestamp: new Date(Date.now() - 248400000).toISOString(),
        isOutgoing: false,
        isSeen: true,
      },
      {
        id: "4",
        text: "I'll come by tomorrow to assess the work needed.",
        sender: "me",
        timestamp: new Date(Date.now() - 244800000).toISOString(),
        isOutgoing: true,
        isSeen: false,
      },
      {
        id: "info2",
        text: "Great! The job has started successfully!",
        sender: "info",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        isOutgoing: false,
        isSeen: true,
        type: "info",
      },
    ],
    "Sophia Williams": [
      {
        id: "1",
        text: "Hi! I'm an architect and I have a client who needs renovation work.",
        sender: "them",
        timestamp: new Date(Date.now() - 345600000).toISOString(),
        isOutgoing: false,
        isSeen: true,
      },
      {
        id: "2",
        text: "Hello Sophia! I'd be happy to work with you and your client.",
        sender: "me",
        timestamp: new Date(Date.now() - 342000000).toISOString(),
        isOutgoing: true,
        isSeen: true,
      },
      {
        id: "info1",
        text: "Quote prepared and sent",
        sender: "info",
        timestamp: new Date(Date.now() - 338400000).toISOString(),
        isOutgoing: false,
        isSeen: true,
        type: "info",
      },
      {
        id: "3",
        text: "Great! It's a living room renovation project.",
        sender: "them",
        timestamp: new Date(Date.now() - 334800000).toISOString(),
        isOutgoing: false,
        isSeen: true,
      },
      {
        id: "4",
        text: "I can provide a detailed quote once I see the space.",
        sender: "me",
        timestamp: new Date(Date.now() - 331200000).toISOString(),
        isOutgoing: true,
        isSeen: true,
      },
      {
        id: "info2",
        text: "Project completed successfully",
        sender: "info",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        isOutgoing: false,
        isSeen: true,
        type: "info",
      },
    ],
  };

  useEffect(() => {
    // Set the conversation messages based on the selected contact
    const conversationMessages = fakeConversations[conversation.name] || [];
    setMessages(conversationMessages);
  }, [conversation.name]);

  // Scroll to bottom when messages are loaded
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const sendMessage = () => {
    if (message.trim()) {
      // Create animated value for the new message
      const animatedValue = new Animated.Value(0);
      
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: "me",
        timestamp: new Date().toISOString(),
        isOutgoing: true,
        isSeen: false,
        animatedValue: animatedValue,
        isNew: true,
      };
      
      setMessages((prev) => [...prev, newMessage]);
      setMessage("");

      // Start the animation after a small delay to ensure the message is rendered
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Remove the isNew flag after animation
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === newMessage.id ? { ...msg, isNew: false } : msg
            )
          );
        });
      }, 50);

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Function to add info messages
  const addInfoMessage = (text) => {
    const animatedValue = new Animated.Value(0);
    
    const infoMessage = {
      id: Date.now().toString(),
      text: text,
      sender: "info",
      timestamp: new Date().toISOString(),
      isOutgoing: false,
      isSeen: true,
      animatedValue: animatedValue,
      isNew: true,
      type: "info",
    };
    
    setMessages((prev) => [...prev, infoMessage]);

    // Start the animation after a small delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 400,
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
            // Create animated value for this specific message
            const animatedValue = new Animated.Value(1);
            
            // Mark message for deletion
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === message.id
                  ? { ...msg, isDeleting: true, animatedValue: animatedValue }
                  : msg
              )
            );

            // Start the animation
            Animated.parallel([
              Animated.timing(animatedValue, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
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

    const renderReadStatus = () => {
      if (isMyMessage) {
        if (item.isSeen) {
          return (
            <View style={styles.readStatusContainer}>
              <Ionicons
                name="checkmark-done"
                size={12}
                color={colors.success}
              />
            </View>
          );
        } else {
          return (
            <View style={styles.readStatusContainer}>
              <Ionicons name="checkmark" size={12} color={colors.white} />
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
            item.isDeleting && item.animatedValue && {
              opacity: item.animatedValue,
              transform: [
                {
                  translateY: item.animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
            item.isNew && item.animatedValue && {
              opacity: item.animatedValue,
              transform: [
                {
                  translateY: item.animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: item.animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.infoMessageBubble}
            onLongPress={() => handleLongPress(item)}
          >
            <StyledText
              text={item.text}
              style={styles.infoMessageText}
            />
            <StyledLabel
              text={formatTime(item.timestamp)}
              style={styles.infoMessageTime}
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
          item.isDeleting && item.animatedValue && {
            opacity: item.animatedValue,
            transform: [
              {
                translateX: item.animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [isMyMessage ? 50 : -50, 0],
                }),
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
                scale: item.animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        {!isMyMessage && (
          <Avatar
            size="sm"
            text={conversation.name}
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
            text={conversation.name}
            style={styles.messageAvatar}
          />
          <View>
            <StyledText
              text={conversation.name}
              style={[styles.headerTitle, { color: theme.textColor }]}
            />
            <StyledLabel
              text={conversation.profession}
              style={[
                styles.headerSubtitle,
                { color: theme.textColorSecondary || theme.textColor + "80" },
              ]}
            />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
        />

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
    marginRight: 4,
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
    backgroundColor: "#F3F4F6",
    maxWidth: "85%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoMessageText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  infoMessageTime: {
    fontSize: 10,
    fontFamily: "Poppins-Regular",
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
});
