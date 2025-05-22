import {
  Image,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import React, { useState } from "react";
import { colors } from "../constants/colors";
import { styles as mystyle } from "../constants/styles";

export default function StyledTextInput({
  value,
  placeholder,
  onChangeText,
  icon,
  keyboardType,
  textContentType,
  secureTextEntry,
}) {
  const colorSheme = useColorScheme();
  const theme = colors[colorSheme] ?? colors.light;

  const [borderColor, setBorderColor] = useState(
    colorSheme === "dark" ? colors.darkGray : colors.gray
  );
  const onFocusHandler = () => setBorderColor(colors.primary);

  const onBlurHandler = () => {
    if (colorSheme === "dark") setBorderColor(colors.darkGray);
    else setBorderColor(colors.gray);
  };

  return (
    <View
      style={[
        styles.inputContainer,
        {
          borderColor: borderColor,
          backgroundColor: theme.textInputBg,
          color: colorSheme === "light" ? colors.black : colors.white,
        },
      ]}
    >
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
        textContentType={ textContentType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderRadius: mystyle.borderRadius,
    paddingHorizontal: mystyle.paddingHorizontal,
    width: "100%",
    borderWidth: 0.5,
    marginVertical: mystyle.marginVertical,
    flexDirection: "row",
    alignItems: "center",
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
