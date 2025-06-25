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
import ThemedView from "../../components/ThemedView";
import Avatar from "../../components/Avatar";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import ConversationScreen from "./conversation-screen";

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default ConversationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    marginRight: 8,
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