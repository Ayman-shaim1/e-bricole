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
  selectedOptionText,
  setOption,
}) {
  const [showModal, setShowModal] = useState(false);

  const handleSelect = (item) => {
    setOption(item.value);
    setShowModal(false);
  };

  return (
    <>
      <StyledTextInput
        editable={false}
        onPress={() => setShowModal(true)}
        icon={icon}
        value={selectedOptionText}
      />
      <BottomModal
        style={styles.modalContainer}
        visible={showModal}
        onClose={() => setShowModal(false)}
      >
        <FlatList
          data={options}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={[styles.optionContainer]}
                onPress={() => handleSelect(item)}
              >
                {item.icon && item.icon}
                {item.image && <Image source={item.image} width={30} />}

                <StyledLabel text={item.label} />
              </TouchableOpacity>
            );
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
