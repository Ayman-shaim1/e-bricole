import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { View, Text, TouchableOpacity, Animated, PanResponder, TouchableWithoutFeedback } from "react-native";
import StyledCard from "./StyledCard";
import Avatar from "./Avatar";
import { useTheme } from "../context/ThemeContext";
import { colors } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";

const ConversationItem = forwardRef(({ conversation, onPress, onDelete }, ref) => {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  
  const pan = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;
  const swipeThreshold = -70; // Slightly reduced threshold
  const closeThreshold = 20; // Threshold for closing with right swipe

  const snapToOriginal = () => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: 0,
        tension: 120,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Expose reset function to parent component
  useImperativeHandle(ref, () => ({
    resetPosition: snapToOriginal,
  }));

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderGrant: () => {
        pan.setOffset(pan._value);
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentValue = pan._value + pan._offset;
        
        // Allow swipe left (negative) and right (positive) but with limits
        if (gestureState.dx <= 0) {
          // Swipe left - reveal delete button
          pan.setValue(gestureState.dx);
        } else if (currentValue < 0) {
          // Swipe right - but only if currently swiped left
          const newValue = Math.min(0, currentValue + gestureState.dx);
          pan.setValue(newValue - pan._offset);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        const currentValue = pan._value;
        
        if (gestureState.dx < swipeThreshold) {
          // Snap to reveal delete button
          snapToDelete();
        } else if (gestureState.dx > closeThreshold || currentValue > -20) {
          // Snap back to original position
          snapToOriginal();
        } else if (currentValue < swipeThreshold) {
          // Already opened, keep it open
          snapToDelete();
        } else {
          // Default to original position
          snapToOriginal();
        }
      },
    })
  ).current;

  const snapToDelete = () => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: swipeThreshold,
        tension: 120,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.spring(buttonOpacity, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDelete = () => {
    // Animate out before deleting
    Animated.parallel([
      Animated.timing(pan, {
        toValue: -300,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDelete && onDelete(conversation);
    });
  };

  const handleOutsidePress = () => {
    if (pan._value < 0) {
      snapToOriginal();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Delete Button Background */}
        <Animated.View style={{
          position: 'absolute',
          right: 0,
          top: 8,
          bottom: 8,
          width: 60, // Reduced width for smaller button
          backgroundColor: colors.danger,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 12, // More rounded for cooler look
          opacity: buttonOpacity,
          transform: [{ scale: buttonScale }],
        }}>
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>

        {/* Main Content */}
        <Animated.View
          style={{
            transform: [{ translateX: pan }],
            backgroundColor: theme.cardColor,
            borderRadius: 16,
          }}
          {...panResponder.panHandlers}
        >
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
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
});

export default ConversationItem;
