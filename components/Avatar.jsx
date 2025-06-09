import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

const SIZES = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export default function Avatar({ 
  size = 'md', 
  source, 
  text, 
  style,
  borderWidth = 2,
  borderColor = colors.primary,
}) {
  const [imageError, setImageError] = useState(false);
  const dimension = SIZES[size];

// Get initials from text (max 2 characters)
  const getInitials = (text) => {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const words = text.trim().split(' ');

    if (words.length === 1) {
      return text.slice(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const renderContent = () => {
    if (source && !imageError) {
      return (
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={[styles.image, { width: dimension, height: dimension }]}
          onError={() => setImageError(true)}
        />
      );
    }

    const initials = getInitials(text);

    return (
      <View style={[styles.textContainer, { width: dimension, height: dimension }]}>
        <Text style={[styles.text, { fontSize: dimension * 0.4 }]}>
          {initials}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderWidth,
          borderColor,
        },
        style,
      ]}
    >
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.accentLight3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
  },
  text: {
    color: colors.primary,
    fontWeight: '400',
  },
}); 