import { Image, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import React, { useState } from "react";
import { colors } from "../constants/colors";
import { styles as mystyle } from "../constants/styles";
import StyledLabel from "./StyledLabel";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
const IMAGE_ICON = require("../assets/icons/image.png");

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export default function StyledImagePicker({ image, onImageChange, customLabel }) {
  const [internalImage, setInternalImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentImage = image !== undefined ? image : internalImage;
  const setCurrentImage = onImageChange || setInternalImage;
  
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

  const compressImage = async (uri) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Start with 50% quality
        base64: false,
      });

      if (!result.canceled) {
        const isValid = await checkImageSize(result.assets[0].uri);
        if (isValid) {
          return result.assets[0].uri;
        } else {
          // If still too large, try with lower quality
          const compressedResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.3, // Try with 30% quality
            base64: false,
          });

          if (!compressedResult.canceled) {
            const isCompressedValid = await checkImageSize(compressedResult.assets[0].uri);
            if (isCompressedValid) {
              return compressedResult.assets[0].uri;
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error compressing image:', error);
      return null;
    }
  };
  
  const pickImageHandler = async () => {
    try {
      setIsLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos to upload images.",
          [{ text: "OK" }]
        );
        return;
      }

      const compressedUri = await compressImage();
      
      if (compressedUri) {
        setCurrentImage(compressedUri);
      } else {
        Alert.alert(
          "Image Size Error",
          "The selected image is too large. Please select an image smaller than 5MB.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        "Error",
        "An error occurred while selecting the image. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.picker, isLoading && styles.pickerDisabled]} 
      onPress={pickImageHandler}
      disabled={isLoading}
    >
      {currentImage ? (
        <View style={styles.imageContainer}>
          <TouchableOpacity
            style={styles.deleteIcon}
            onPress={() => setCurrentImage(null)}
          >
            <Feather name="x" size={17} color="white" />
          </TouchableOpacity>
          <Image source={{ uri: currentImage }} style={styles.selectedImage} />
        </View>
      ) : (
        <Image source={IMAGE_ICON} style={styles.iconImage} />
      )}

      <StyledLabel 
        text={customLabel?.title || "choose your image"} 
        color={"primary"} 
      />
      <StyledLabel
        text={customLabel?.subtitle || "click on the box to select an image"}
        color={"darkGray"}
      />
      {isLoading && (
        <StyledLabel
          text="Processing image..."
          color={"primary"}
          style={styles.loadingText}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
  },
  deleteIcon: {
    backgroundColor: colors.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 10,
    right: 1,
    zIndex: 200,
  },
  selectedImage: {
    width: 50,
    height: 50,
    marginTop: 20,
    borderRadius: 25,
    zIndex: 100,
  },
  iconImage: {
    marginBottom: 10,
    width: 30,
    height: 30,
  },
  picker: {
    marginVertical: 5,
    backgroundColor: colors.accentLight3,
    padding: 10,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: mystyle.borderRadius,
    alignItems: "center",
  },
  pickerDisabled: {
    opacity: 0.7,
  },
  loadingText: {
    marginTop: 5,
    fontSize: 12,
  },
});
