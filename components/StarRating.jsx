import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";

/**
 * StarRating Component
 * Allows users to select a rating from 0 to 5 stars with half-star precision
 * Always displays 5 stars, fills them based on rating
 * 
 * @param {Object} props - Component props
 * @param {number} props.rating - Current rating value (0-5)
 * @param {Function} props.onRatingChange - Callback when rating changes
 * @param {string} props.label - Label text above the stars
 * @param {number} props.size - Size of the stars (default: 32)
 * @param {boolean} props.readonly - Whether the rating is readonly (default: false)
 * @param {boolean} props.hideRating - Whether to hide the rating text display (default: false)
 */
export default function StarRating({
  rating = 0,
  onRatingChange,
  label = "Review note",
  size = 32,
  readonly = false,
  hideRating = false,
}) {
  const handleStarPress = (starIndex, event) => {
    if (readonly || !onRatingChange) return;
    
    // Get the touch position relative to the star
    const { nativeEvent } = event;
    const { locationX } = nativeEvent;
    
    // Determine if it's a half star or full star based on touch position
    const isLeftHalf = locationX < size / 2;
    
    let newRating;
    if (isLeftHalf) {
      newRating = starIndex + 0.5;
    } else {
      newRating = starIndex + 1;
    }
    
    onRatingChange(newRating);
  };

  const renderStar = (starIndex) => {
    const starPosition = starIndex + 1; // 1-based position (1,2,3,4,5)
    const isFullStar = rating >= starPosition;
    const isHalfStar = rating >= starIndex + 0.5 && rating < starPosition;
    const isEmpty = rating < starIndex + 0.5;

    return (
      <TouchableOpacity
        key={starIndex}
        style={styles.starTouchable}
        onPress={(event) => handleStarPress(starIndex, event)}
        disabled={readonly}
        activeOpacity={0.7}
      >
        <View style={styles.starContainer}>
          {/* Always show the outline star as background */}
          <Ionicons
            name="star-outline"
            size={size}
            color={colors.gray}
            style={styles.backgroundStar}
          />
          
          {/* Overlay the filled portion */}
          {isFullStar && (
            <View style={styles.fullStarOverlay}>
              <Ionicons
                name="star"
                size={size}
                color={colors.warning}
              />
            </View>
          )}
          
          {isHalfStar && (
            <View style={styles.halfStarOverlay}>
              <Ionicons
                name="star"
                size={size}
                color={colors.warning}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label && <StyledLabel text={label} style={styles.label} />}
      <View style={styles.starsContainer}>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </View>
      {!hideRating && (
        <StyledLabel 
          text={`${rating}/5`} 
          style={styles.ratingText} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 15,
  },
  label: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  starTouchable: {
    marginHorizontal: 4,
    padding: 4,
  },
  starContainer: {
    position: "relative",
  },
  backgroundStar: {
    position: "relative",
  },
  fullStarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  halfStarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "50%",
    overflow: "hidden",
  },
  ratingText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
}); 