import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";
import StyledTextInput from "./StyledTextInput";
import BottomModal from "./BottomModal";
import StyledLabel from "./StyledLabel";
import { colors } from "../constants/colors";

export default function StyledDropdown({ 
  options = [], 
  icon, 
  selectedOption, 
  setOption, 
  withIcons = false,
  getOptionLabel = (item) => typeof item === 'object' ? item.label : item,
  getOptionIcon = (item) => typeof item === 'object' ? item.icon : null,
  getOptionValue = (item) => typeof item === 'object' ? item.value : item,
}) {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(selectedOption || (options.length > 0 ? getOptionLabel(options[0]) : ""));
  const [selectedItem, setSelectedItem] = useState(options.length > 0 ? options[0] : null);

  useEffect(() => {
    if (selectedOption) {
      // Find the option that matches the selectedOption
      const foundOption = options.find(opt => 
        getOptionLabel(opt) === selectedOption || getOptionValue(opt) === selectedOption
      );
      if (foundOption) {
        setSelectedItem(foundOption);
        setSelected(getOptionLabel(foundOption));
      } else {
        setSelected(selectedOption);
      }
    }
  }, [selectedOption, options]);

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSelected(getOptionLabel(item));
    if (setOption) {
      // Pass the whole item or just the value based on what the parent expects
      setOption(withIcons ? item : getOptionValue(item));
    }
    setShowModal(false);
  };

  return (
    <>
      <StyledTextInput
        editable={false}
        onPress={() => setShowModal(true)}
        icon={icon}
        placeholder={selected}
        value={selected}
      />
      <BottomModal
        style={styles.modalContainer}
        visible={showModal}
        onClose={() => setShowModal(false)}
      >
        <FlatList
          data={options}
          renderItem={({ item }) => {
            const itemLabel = getOptionLabel(item);
            const itemIcon = withIcons ? getOptionIcon(item) : null;
            const isSelected = selectedItem === item || selected === itemLabel;
            
            return (
              <TouchableOpacity 
                style={[styles.optionContainer, isSelected && styles.selectedOption]} 
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                {withIcons && itemIcon ? (
                  <View style={styles.optionWithIconContainer}>
                    <Image source={itemIcon} style={styles.optionIcon} />
                    <StyledLabel 
                      text={itemLabel} 
                      textStyle={[styles.optionWithIconText, isSelected && styles.selectedText]} 
                    />
                  </View>
                ) : (
                  <StyledLabel 
                    text={itemLabel} 
                    textStyle={isSelected && styles.selectedText} 
                  />
                )}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item, index) => {
            const itemValue = getOptionValue(item);
            return typeof itemValue === 'string' ? itemValue : index.toString();
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          bounces={false}
          overScrollMode="never"
        />
      </BottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  optionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedOption: {
    backgroundColor: colors.lightPrimary,
  },
  selectedText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  optionWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  optionWithIconText: {
    flex: 1,
  },
});
