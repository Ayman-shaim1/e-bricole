import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

const TabBadge = ({ count, size = 18, right = -6, top = -3 }) => {
  if (!count || count <= 0) {
    return null;
  }

  // Show "99+" if count is greater than 99
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[
      styles.badge,
      {
        right: right,
        top: top,
        minWidth: size,
        height: size,
        borderRadius: size / 2,
      }
    ]}>
      <Text style={[
        styles.badgeText,
        {
          fontSize: displayCount.length > 2 ? 8 : 10,
          lineHeight: size,
        }
      ]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    zIndex: 1,
  },
  badgeText: {
    color: colors.white,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
});

export default TabBadge; 