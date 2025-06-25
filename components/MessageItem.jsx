import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import StyledCard from "./StyledCard";
import Avatar from "./Avatar";
import { colors } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function MessageItem({ message, onPress }) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const isInfoMessage = message.type === "info";

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
    return (
      <StyledCard style={[styles.card, styles.infoCard]}>
        <TouchableOpacity
          style={[styles.touchable, styles.infoTouchable]}
          activeOpacity={0.8}
          onPress={() => onPress(message)}
        >
          <View style={styles.infoContainer}>
            <View style={styles.infoBubble}>
              <Text style={styles.infoText} numberOfLines={2}>
                {message.message}
              </Text>
              <Text style={styles.infoTime} numberOfLines={1}>
                {message.time}
              </Text>
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
                  {message.time}
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
    backgroundColor: "#F3F4F6",
    maxWidth: "85%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  infoTime: {
    fontSize: 10,
    fontFamily: "Poppins-Regular",
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
}); 