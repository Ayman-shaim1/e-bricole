import {
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Platform,
  TouchableOpacity,
} from "react-native";
import React, { useState, useCallback } from "react";
import { colors } from "../constants/colors";
import { styles as mystyle } from "../constants/styles";
import { useTheme } from "../context/ThemeContext";

export default function StyledTextInput({
  value,
  placeholder,
  onChangeText,
  icon,
  keyboardType,
  textContentType,
  secureTextEntry,
  editable = true,
  onPress,
  width,
  style,
}) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  const [borderColor, setBorderColor] = useState(
    theme === colors.dark ? colors.darkGray : colors.gray
  );

  const onFocusHandler = useCallback(() => setBorderColor(colors.primary), []);

  const onBlurHandler = useCallback(() => {
    if (theme === colors.dark) setBorderColor(colors.darkGray);
    else setBorderColor(colors.gray);
  }, [theme]);

 

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: borderColor,
          backgroundColor: theme.textInputBg,
          width: width || "100%",
        },
      ]}
    >
      <View style={styles.inputWrapper}>
        {icon && <Image source={icon} style={styles.icon} />}
        <TextInput
          style={[styles.input, { ...style }, { color: theme.textInputColor }]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={theme.placeholderColor}
          onFocus={onFocusHandler}
          onBlur={onBlurHandler}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          textContentType={textContentType}
          editable={editable && !onPress}
          onPress={onPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: mystyle.borderRadius,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: mystyle.fontSize,
    padding: 0,
  },
});
