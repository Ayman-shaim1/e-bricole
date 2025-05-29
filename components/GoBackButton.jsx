import {
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from "../context/ThemeContext";

export default function GoBackButton() {
  const router = useRouter();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  return (
    <TouchableOpacity style={styles.bouton} onPress={() => router.back()}>
     <MaterialIcons name="arrow-back-ios" size={24} color={theme.iconColor} />  
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bouton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:'center',
    width:30,
    height:50,
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 5,
    marginTop: Platform.OS === "ios" ? 2 : 0,
  },
});
