import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import StyledText from './StyledText';
import { getStatusColor, getStatusIcon } from '../utils/statusUtils';

export default function StatusBadge({ status, size = "medium", style }) {
  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18
  };

  const textSizes = {
    small: 12,
    medium: 13,
    large: 14
  };

  const paddings = {
    small: {
      horizontal: 8,
      vertical: 4
    },
    medium: {
      horizontal: 10,
      vertical: 4
    },
    large: {
      horizontal: 12,
      vertical: 6
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getStatusColor(status) + "20",
          paddingHorizontal: paddings[size].horizontal,
          paddingVertical: paddings[size].vertical
        },
        style
      ]}
    >
      <MaterialCommunityIcons
        name={getStatusIcon(status)}
        size={iconSizes[size]}
        color={getStatusColor(status)}
        style={styles.icon}
      />
      <StyledText
        text={status}
        style={[
          styles.text,
          { 
            color: getStatusColor(status),
            fontSize: textSizes[size]
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: "600",
    textTransform: "capitalize",
  }
}); 