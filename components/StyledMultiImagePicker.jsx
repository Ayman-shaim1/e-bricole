import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
  Pressable,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { colors } from "../constants/colors";
import { styles as mystyle } from "../constants/styles";
import StyledLabel from "./StyledLabel";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';

const IMAGE_ICON = require("../assets/icons/image.png");
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = (SCREEN_WIDTH - 60) / 3; // 3 images per row with padding
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export default function StyledMultiImagePicker({
  images,
  onImagesChange,
  customLabel,
  maxImages = 5,
}) {
  const checkImageSize = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        return fileInfo.size <= MAX_IMAGE_SIZE;
      }
      return false;
    } catch (error) {
      console.error('Error checking image size:', error);
      return false;
    }
  };

  const pickImageHandler = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access media library is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: maxImages - (images?.length || 0),
    });

    if (!result.canceled) {
      // Check size for each selected image
      const validImages = [];
      const invalidImages = [];

      for (const asset of result.assets) {
        const isValid = await checkImageSize(asset.uri);
        if (isValid) {
          validImages.push(asset.uri);
        } else {
          invalidImages.push(asset.uri);
        }
      }

      if (invalidImages.length > 0) {
        Alert.alert(
          "Image Size Error",
          "Some images exceed the 5MB size limit and were not added. Please select smaller images.",
          [{ text: "OK" }]
        );
      }

      if (validImages.length > 0) {
        const newImages = [...(images || []), ...validImages];
        onImagesChange(newImages);
      }
    }
  };

  const removeImage = (indexToRemove) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <StyledLabel
          text={customLabel?.title || "Add Images"}
          color={"primary"}
          style={styles.titleLabel}
        />
        <StyledLabel
          text={customLabel?.subtitle || `Select up to ${maxImages} images`}
          color={"darkGray"}
          style={styles.subtitleLabel}
        />
      </View>

      <View style={styles.scrollViewContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          decelerationRate="fast"
          snapToInterval={IMAGE_SIZE + 12}
          snapToAlignment="start"
          bounces={false}
          scrollEventThrottle={16}
          directionalLockEnabled={true}
          removeClippedSubviews={true}
        >
          {images?.map((imageUri, index) => (
            <Pressable 
              key={index} 
              style={styles.imageContainer}
              onPress={() => {}} // Empty onPress to prevent scroll interference
            >
              <Image 
                source={{ uri: imageUri }} 
                style={styles.selectedImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.deleteIcon}
                onPress={() => removeImage(index)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={16} color="white" />
              </TouchableOpacity>
            </Pressable>
          ))}
          
          {(!images || images.length < maxImages) && (
            <Pressable 
              style={styles.picker} 
              onPress={pickImageHandler}
            >
              <View style={styles.pickerContent}>
                <Image source={IMAGE_ICON} style={styles.iconImage} />
                <Text style={styles.pickerText}>Add Photo</Text>
              </View>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 10,
  },
  labelContainer: {
    marginBottom: 12,
  },
  titleLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitleLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollViewContainer: {
    width: "100%",
    height: IMAGE_SIZE + 20,
  },
  scrollViewContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: colors.accentLight3,
  },
  selectedImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
  },
  deleteIcon: {
    backgroundColor: colors.danger,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 200,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  picker: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    backgroundColor: colors.accentLight3,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 32,
    height: 32,
    marginBottom: 8,
    opacity: 0.7,
  },
  pickerText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "500",
  },
});
