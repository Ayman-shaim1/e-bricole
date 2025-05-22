import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../constants/colors';
import { useRouter, usePathname } from 'expo-router';

const tabs = [
  { icon: 'home', path: '/home', label: 'Home' },
  { icon: 'activity', path: '/activity', label: 'Activity' },
  { icon: 'credit-card', path: '/payment', label: 'Payment' },
  { icon: 'message-circle', path: '/messages', label: 'Messages' },
];

const BottomBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <View style={styles.container}>
      {tabs.map((tab, idx) => {
        const active = isActive(tab.path);
        return (
          <TouchableOpacity
            key={tab.path}
            style={[styles.tab, active && styles.activeTab]}
            onPress={() => router.push(tab.path)}
            activeOpacity={0.8}
          >
            <View style={styles.iconLabelWrapper}>
              <Icon
                name={tab.icon}
                size={24}
                color={active ? colors.primary : colors.gray}
                style={active ? styles.activeIcon : null}
              />
              <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray + '20',
    paddingBottom: 8,
    paddingTop: 4,
    height: 70,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  activeTab: {
    backgroundColor: colors.primary + '10',
  },
  iconLabelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
    fontWeight: '500',
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeIcon: {
    // Optionally add shadow or scale for active icon
  },
});

export default BottomBar; 