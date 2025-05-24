import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import StyledTextInput from './StyledTextInput';
import StyledText from './StyledText';
import StyledLabel from './StyledLabel';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../constants/colors';

const SkillsInput = ({ value = [], onChange, placeholder, icon }) => {
  const [currentSkill, setCurrentSkill] = useState('');
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const handleSkillInput = (text) => {
    // Check if text ends with a space
    if (text.endsWith(' ')) {
      // Remove the space and trim
      const newSkill = text.slice(0, -1).trim();
      if (newSkill && !value.includes(newSkill)) {
        onChange([...value, newSkill]);
        setCurrentSkill('');
      } else {
        // If skill is empty or duplicate, just clear the input
        setCurrentSkill('');
      }
      return;
    }
    // Otherwise just update the current skill text
    setCurrentSkill(text);
  };

  const handleSubmit = () => {
    const newSkill = currentSkill.trim();
    if (newSkill && !value.includes(newSkill)) {
      onChange([...value, newSkill]);
      setCurrentSkill('');
    }
    // Return true to prevent default behavior
    return true;
  };

  const removeSkill = (skillToRemove) => {
    onChange(value.filter(skill => skill !== skillToRemove));
  };

  return (
    <View style={styles.container}>
      <StyledTextInput
        placeholder={placeholder}
        icon={icon}
        value={currentSkill}
        onChangeText={handleSkillInput}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        blurOnSubmit={false}
        multiline={false}
      />
      <View style={styles.skillsContainer}>
        {value.map((skill, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.skillTag, isDarkMode ? styles.skillTagDark : styles.skillTagLight]}
            onPress={() => removeSkill(skill)}
          >
            <StyledLabel text={skill} style={styles.skillText} />
            <StyledLabel text="×" style={styles.removeIcon} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillTagLight: {
    backgroundColor: colors.accentLight2,
  },
  skillTagDark: {
    backgroundColor: colors.dark.navBackgroundColor,
    borderWidth: 1,
    borderColor: colors.dark.iconColor,
  },
  skillText: {
    fontSize: 14,
  },
  removeIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SkillsInput; 