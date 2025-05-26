import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "../constants/colors";
import { styles as mystyles } from "../constants/styles";
import { useTheme } from "../context/ThemeContext";
import StyledText from "./StyledText";
import { TouchableOpacity } from "react-native";

export default function StyledCard({ 
  children, 
  style, 
  onPress, 
  title, 
  onSeeAll,
  showHeader = true 
}) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: theme.cardColor,
          borderColor: colors.gray,
        },
        style,
      ]}
      onPress={onPress}
    >
      {showHeader && title && (
        <View style={styles.header}>
          <StyledText style={styles.title} text={title} />
          {onSeeAll && (
            <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
              <StyledText 
                style={[styles.seeAllText, { color: theme.primary }]} 
                text="See All" 
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: mystyles.borderRadius,
    overflow: "hidden",
    paddingVertical: mystyles.paddingVertical,
    paddingHorizontal: 20,
    marginTop: 22,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllButton: {
    padding: 5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
