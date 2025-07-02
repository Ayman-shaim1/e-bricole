import { useRef, useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  PanResponder,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CloseButton from "./CloseButton";
import { colors } from "../constants/colors";
import { styles as mystyles } from "../constants/styles";
import { useTheme } from "../context/ThemeContext";

export default function BottomModal({
  visible = false,
  children,
  onClose,
  height = 650,
}) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const dragY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = Math.max(150, height / 2);
        if (gestureState.dy >= threshold) {
          Animated.timing(dragY, {
            toValue: height, // slide all the way down
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            dragY.setValue(0); // reset for next time
            onClose();
          });
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!visible) {
      dragY.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.fullscreenOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.backgroundColor,
              height,
              transform: [{ translateY: dragY }],
            },
          ]}
        >
          {/* Handle zone with PanResponder */}
          <View style={styles.handleZone} {...panResponder.panHandlers}>
            <View style={styles.line} />
            <CloseButton style={styles.btnClose} onPress={onClose} />
          </View>
          
          {/* Scrollable content without PanResponder interference */}
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              bounces={true}
              scrollEnabled={true}
            >
              {children}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreenOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "100%",
    position: "relative",
    borderTopLeftRadius: mystyles.borderRadius,
    borderTopRightRadius: mystyles.borderRadius,
    paddingHorizontal: 15,
    paddingTop: 10,
    overflow: "hidden",
  },
  handleZone: {
    paddingVertical: 10,
    alignItems: "center",
  },
  btnClose: {
    alignSelf: "flex-end",
    marginTop: 5,
  },
  line: {
    height: 4,
    width: 70,
    backgroundColor: colors.gray,
    alignSelf: "center",
    borderRadius: mystyles.borderRadius,
    marginBottom: 5,
  },
});
