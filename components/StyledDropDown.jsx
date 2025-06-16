import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
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
  selectedOptionText,
  setOption,
  valueKey = "value",
  labelKey = "label",
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("-- select option --");

  useEffect(() => {
    // Update selected label when selectedOption changes
    if (selectedOption) {
      const selected = options.find(opt => opt[valueKey] === selectedOption);
      if (selected) {
        setSelectedLabel(selected[labelKey]);
      }
    } else {
      setSelectedLabel("-- select option --");
    }
  }, [selectedOption, options]);

  const handleSelect = (item) => {
    setOption(item[valueKey]);
    setSelectedLabel(item[labelKey]);
    setShowModal(false);
  };

  return (
    <>
      <StyledTextInput
        editable={false}
        onPress={() => setShowModal(true)}
        icon={icon}
        value={selectedLabel}
        placeholder="-- select option --"
      />
      <BottomModal
        style={styles.modalContainer}
        visible={showModal}
        onClose={() => setShowModal(false)}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          bounces={false}
        >
          {options.map((item, index) => {
            const isSelected = item[valueKey] === selectedOption;
            const key = item[valueKey] || `option-${index}`; // Ensure unique key
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionContainer,
                  isSelected && styles.selectedOption
                ]}
                onPress={() => handleSelect(item)}
              >
                {item.icon && item.icon}
                {item.image && <Image source={item.image} width={30} />}

                <StyledLabel 
                  text={item[labelKey]} 
                  style={isSelected && styles.selectedText}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
    fontWeight: "bold",
  },
  optionWithIconContainer: {
    flexDirection: "row",
    alignItems: "center",
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
