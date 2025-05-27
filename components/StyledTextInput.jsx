import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import React, { useState } from "react";
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
  editable,
  onPress,
  width,
}) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  const [borderColor, setBorderColor] = useState(
    theme === colors.dark ? colors.darkGray : colors.gray
  );
  const onFocusHandler = () => setBorderColor(colors.primary);

  const onBlurHandler = () => {
    if (theme === colors.dark) setBorderColor(colors.darkGray);
    else setBorderColor(colors.gray);
  };

  // If onPress is provided, wrap the input in a Pressable
  const content = (
    <>
      {icon && <Image source={icon} style={styles.icon} />}
      <TextInput
        style={[styles.input, { color: theme.textInputColor }]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={theme.placeholderColor}
        onFocus={onFocusHandler}
        onBlur={onBlurHandler}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        editable={editable}
        pointerEvents={onPress ? "none" : "auto"}
      />
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.inputContainer,
        {
          borderColor: borderColor,
          backgroundColor: theme.textInputBg,
          color: theme === colors.light ? colors.black : colors.white,
          opacity: pressed && onPress ? 0.8 : 1,
          width: width ? width : "100%",
        },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderRadius: mystyle.borderRadius,
    paddingHorizontal: mystyle.paddingHorizontal,
    borderWidth: 0.5,
    marginVertical: mystyle.marginVertical,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
  },
  input: {
    paddingVertical: mystyle.paddingVertical,

    fontSize: mystyle.fontSize,
    fontFamily: "Poppins-Regular",
    width: "100%",
  },
  icon: {
    width: 17,
    height: 17,
    marginRight: 10,
  },
});
