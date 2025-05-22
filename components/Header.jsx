import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../constants/colors';
import StyledText from './StyledText';
import StyledHeading from './StyledHeading';

export default function Header() {
  return (
    <View style={styles.headerContent}>
      <View style={styles.userInfo}>
        <StyledHeading text="John Doe" style={styles.userName} />
        <View style={styles.locationContainer}>
          <Icon name="map-pin" size={16} color={colors.primary} style={styles.locationIcon} />
          <StyledText text="New York, USA" style={styles.position} />
        </View>
      </View>
      <TouchableOpacity style={styles.notificationButton}>
        <View style={styles.notificationIconContainer}>
          <Icon name="bell" size={24} color={colors.primary} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>2</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 40,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 6,
  },
  position: {
    fontSize: 14,
    color: colors.darkGray,
  },
  notificationButton: {
    padding: 8,
    marginLeft: 8,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});


