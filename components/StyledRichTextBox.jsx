import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import React, { useState } from "react";
import { colors } from "../constants/colors";
import { styles as mystyle } from "../constants/styles";
import { useTheme } from "../context/ThemeContext";

export default function StyledRichTextBox({
  value,
  placeholder,
  onChangeText,
  icon,
  editable,
  onPress,
  width,
  minHeight = 120,
  maxLength,
  numberOfLines = 6,
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
        style={[
          styles.input,
          { 
            color: theme.textInputColor,
            minHeight: minHeight - (mystyle.paddingVertical * 2),
            textAlignVertical: "top"
          }
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={theme.placeholderColor}
        onFocus={onFocusHandler}
        onBlur={onBlurHandler}
        editable={editable}
        pointerEvents={onPress ? "none" : "auto"}
        multiline={true}
        numberOfLines={numberOfLines}
        scrollEnabled={true}
        maxLength={maxLength}
        returnKeyType="default"
        blurOnSubmit={false}
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
          minHeight: minHeight,
          alignItems: "flex-start",
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
    zIndex: 100,
  },
  input: {
    paddingVertical: mystyle.paddingVertical,
    fontSize: mystyle.fontSize,
    fontFamily: "Poppins-Regular",
    width: "100%",
    flex: 1,
  },
  icon: {
    width: 17,
    height: 17,
    marginRight: 10,
    marginTop: mystyle.paddingVertical,
  },
});
