import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { colors } from "../constants/colors";
import { styles as mystyle } from "../constants/styles";
import StyledLabel from "./StyledLabel";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
const IMAGE_ICON = require("../assets/icons/image.png");

export default function StyledImagePicker({ image, onImageChange, customLabel }) {
  // Use internal state only if no external state is provided
  const [internalImage, setInternalImage] = useState(null);
  
  // Determine which image and setter to use
  const currentImage = image !== undefined ? image : internalImage;
  const setCurrentImage = onImageChange || setInternalImage;
  
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
    });

    if (!result.canceled) {
      setCurrentImage(result.assets[0].uri);
    }
  };

  return (
    <TouchableOpacity style={styles.picker} onPress={pickImageHandler}>
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

      <StyledLabel text={customLabel?.title || "choose your image"} color={"primary"} />
      <StyledLabel
        text={customLabel?.subtitle || "click on the box to select an image"}
        color={"darkGray"}
      />
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
});
