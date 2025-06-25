import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import StyledCard from "./StyledCard";
import Avatar from "./Avatar";
import { useTheme } from "../context/ThemeContext";
import { colors } from "../constants/colors";

export default function ConversationItem({ conversation, onPress }) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  return (
    <StyledCard style={{ marginTop: 0, marginBottom: 0 }}>
      <TouchableOpacity onPress={() => onPress(conversation)}>
        {/* Row 1: Avatar | Name | Time */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Avatar size="md" text={conversation.name} />
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 16,
              color: theme.textColor,
              marginLeft: 12,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {conversation.name}
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 12,
              color: theme.textColorSecondary || theme.textColor + "80",
              marginLeft: 8,
            }}
            numberOfLines={1}
          >
            {conversation.time}
          </Text>
        </View>
        {/* Row 2: Last message | Unread badge */}
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
        >
          <Text
            style={{
              fontFamily:
                conversation.unread > 0 ? "Poppins-Medium" : "Poppins-Regular",
              fontSize: 15,
              color:
                conversation.unread > 0
                  ? theme.textColor
                  : (theme.textColorSecondary || theme.textColor + "80"),
              flex: 1,
            }}
            numberOfLines={1}
          >
            {conversation.message}
          </Text>
          {conversation.unread > 0 && (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 6,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: 11,
                  fontFamily: "Poppins-Bold",
                }}
              >
                {conversation.unread > 99 ? "99+" : conversation.unread}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </StyledCard>
  );
}
