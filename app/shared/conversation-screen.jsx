import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ThemedView from "../../components/ThemedView";
import Avatar from "../../components/Avatar";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function ConversationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const flatListRef = useRef(null);

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
      },
      {
        id: "2",
        text: "Hello! Thank you for reaching out. I'd be happy to help with your renovation project.",
        sender: "me",
        timestamp: new Date(Date.now() - 82800000).toISOString(),
      },
      {
        id: "3",
        text: "Great! I have a 3-bedroom apartment that needs a complete renovation.",
        sender: "them",
        timestamp: new Date(Date.now() - 79200000).toISOString(),
      },
      {
        id: "4",
        text: "That sounds like an exciting project! When would you like me to come and take a look?",
        sender: "me",
        timestamp: new Date(Date.now() - 75600000).toISOString(),
      },
      {
        id: "5",
        text: "The renovation work exceeded my expectations. Thank you for your attention to detail.",
        sender: "them",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    "Isabella Rodriguez": [
      {
        id: "1",
        text: "Hi there! I need help with kitchen remodeling.",
        sender: "them",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "2",
        text: "Hello Isabella! I'd love to help with your kitchen project. What's your vision?",
        sender: "me",
        timestamp: new Date(Date.now() - 169200000).toISOString(),
      },
      {
        id: "3",
        text: "I want a modern, open-concept kitchen with an island.",
        sender: "them",
        timestamp: new Date(Date.now() - 165600000).toISOString(),
      },
      {
        id: "4",
        text: "Perfect! When can I come and see the space?",
        sender: "me",
        timestamp: new Date(Date.now() - 162000000).toISOString(),
      },
      {
        id: "5",
        text: "When would you be available for the kitchen remodeling project?",
        sender: "them",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    "Marcus Thompson": [
      {
        id: "1",
        text: "Hello! I need electrical work done in my office building.",
        sender: "them",
        timestamp: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: "2",
        text: "Hi Marcus! I can definitely help with electrical work. What's the scope?",
        sender: "me",
        timestamp: new Date(Date.now() - 255600000).toISOString(),
      },
      {
        id: "3",
        text: "We need new lighting fixtures and some rewiring.",
        sender: "them",
        timestamp: new Date(Date.now() - 252000000).toISOString(),
      },
      {
        id: "4",
        text: "I'll come by tomorrow to assess the work needed.",
        sender: "me",
        timestamp: new Date(Date.now() - 248400000).toISOString(),
      },
      {
        id: "5",
        text: "Your craftsmanship is exceptional. The bathroom looks stunning!",
        sender: "them",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    "Sophia Williams": [
      {
        id: "1",
        text: "Hi! I'm an architect and I have a client who needs renovation work.",
        sender: "them",
        timestamp: new Date(Date.now() - 345600000).toISOString(),
      },
      {
        id: "2",
        text: "Hello Sophia! I'd be happy to work with you and your client.",
        sender: "me",
        timestamp: new Date(Date.now() - 342000000).toISOString(),
      },
      {
        id: "3",
        text: "Great! It's a living room renovation project.",
        sender: "them",
        timestamp: new Date(Date.now() - 338400000).toISOString(),
      },
      {
        id: "4",
        text: "I can provide a detailed quote once I see the space.",
        sender: "me",
        timestamp: new Date(Date.now() - 334800000).toISOString(),
      },
      {
        id: "5",
        text: "Could you provide a detailed quote for the living room project?",
        sender: "them",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
  };

  useEffect(() => {
    // Set the conversation messages based on the selected contact
    const conversationMessages = fakeConversations[conversation.name] || [];
    setMessages(conversationMessages);
  }, [conversation.name]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: "me",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage("");
      
      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender === "me";
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {!isMyMessage && (
          <Avatar 
            size="sm" 
            text={conversation.name}
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          {
            backgroundColor: isMyMessage ? colors.primary : theme.cardColor,
          }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isMyMessage ? colors.white : theme.textColor }
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            { color: isMyMessage ? colors.white + '80' : theme.textColorSecondary }
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>
            {conversation.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textColorSecondary }]}>
            {conversation.profession}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={24} color={theme.textColor} />
          </TouchableOpacity>
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
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        
        <View style={[styles.inputContainer, { backgroundColor: theme.cardColor }]}>
          <TextInput
            style={[
              styles.textInput,
              { 
                backgroundColor: theme.backgroundColor,
                color: theme.textColor,
                borderColor: theme.textColorSecondary + '30',
              }
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={theme.textColorSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              { backgroundColor: message.trim() ? colors.primary : theme.textColorSecondary + '30' }
            ]}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={message.trim() ? colors.white : theme.textColorSecondary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#00000010",
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#00000010",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
}); 