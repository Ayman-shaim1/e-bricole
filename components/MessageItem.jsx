import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import StyledCard from "./StyledCard";
import StyledLabel from "./StyledLabel";
import Avatar from "./Avatar";
import { colors } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import useMessageTime from "../hooks/useMessageTime";

export default function MessageItem({ message, onPress }) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const isInfoMessage = message.type === "info";
  
  // Use the hook to format message time based on creation date
  const formattedTime = useMessageTime(message.lastMessageTime || message.$createdAt);

  const renderReadStatus = () => {
    if (message.isOutgoing) {
      if (message.isSeen) {
        return (
          <View style={styles.readStatusContainer}>
            <Ionicons name="checkmark-done" size={16} color={colors.success} />
          </View>
        );
      } else {
        return (
          <View style={styles.readStatusContainer}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </View>
        );
      }
    }
    return null;
  };

  // Render info message differently
  if (isInfoMessage) {
    // Get theme-appropriate colors for info messages (same as messages-screen.jsx)
    const isDarkTheme = theme.backgroundColor === "#1A1A1A"; // Check if dark theme
    const infoBgColor = isDarkTheme ? "#1C2B3D" : colors.accentLight3; // Dark blue-gray for dark mode
    const infoBorderColor = isDarkTheme ? colors.accentLight1 : colors.accentLight2;
    const infoTextColor = isDarkTheme ? colors.accentLight1 : colors.primary;
    const infoTimeColor = isDarkTheme ? colors.accentLight2 : colors.accentLight1;

    return (
      <StyledCard style={[styles.card, styles.infoCard]}>
        <TouchableOpacity
          style={[styles.touchable, styles.infoTouchable]}
          activeOpacity={0.8}
          onPress={() => onPress(message)}
        >
          <View style={styles.infoContainer}>
            <View style={[
              styles.infoBubble,
              {
                backgroundColor: infoBgColor,
                borderColor: infoBorderColor,
              }
            ]}>
              <StyledLabel
                text={message.message}
                style={[
                  styles.infoText,
                  { 
                    color: infoTextColor,
                    fontSize: 13, // Ensure consistent font size
                    lineHeight: 18 // Ensure consistent line height
                  }
                ]}
              />
              <StyledLabel
                text={formattedTime}
                style={[
                  styles.infoTime,
                  { 
                    color: infoTimeColor,
                    fontSize: 10 // Ensure consistent font size
                  }
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>
      </StyledCard>
    );
  }

  return (
    <StyledCard style={styles.card}>
      <TouchableOpacity
        style={styles.touchable}
        activeOpacity={0.8}
        onPress={() => onPress(message)}
      >
        <View style={styles.row}>
          <Avatar size="md" text={message.name} />
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={[styles.name, { color: theme.textColor }]} numberOfLines={1}>
                {message.name}
              </Text>
              <View style={styles.timeContainer}>
                {renderReadStatus()}
                <Text style={[styles.time, { color: theme.textColorSecondary }]} numberOfLines={1}>
                  {formattedTime}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.message,
                { color: message.unread > 0 ? theme.textColor : theme.textColorSecondary },
                message.unread > 0 && styles.messageUnread,
              ]}
              numberOfLines={2}
            >
              {message.message}
            </Text>
            <View style={styles.footerRow}>
              <Text style={[styles.profession, { color: theme.textColorSecondary }]} numberOfLines={1}>
                {message.profession}
              </Text>
              {message.unread > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}> 
                  <Text style={styles.unreadText}>
                    {message.unread > 99 ? "99+" : message.unread}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </StyledCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    elevation: 0,
    shadowOpacity: 0,
    padding: 0,
  },
  touchable: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    flex: 1,
    marginRight: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  readStatusContainer: {
    marginRight: 4,
  },
  time: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    flexShrink: 0,
  },
  message: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    lineHeight: 20,
    marginBottom: 6,
  },
  messageUnread: {
    fontFamily: "Poppins-Medium",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profession: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  infoCard: {
    backgroundColor: "transparent",
  },
  infoTouchable: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  infoBubble: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    maxWidth: "85%",
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  infoTime: {
    fontSize: 10,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    marginTop: 4,
  },
}); 