import { useRef, useEffect, useState } from "react";
import { Modal, StyleSheet, View, PanResponder, Platform, Dimensions, StatusBar, Animated } from "react-native";
import CloseButton from "./CloseButton";
import { colors } from "../constants/colors";
import { styles as mystyles } from "../constants/styles";
import { useTheme } from "../context/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BottomModal({
  visible = false,
  children,
  onClose,
  style,
}) {
  const [isReady, setIsReady] = useState(false);
  const [dragY, setDragY] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) { // Only allow dragging down
          setDragY(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          onClose?.();
        } else {
          setDragY(0);
        }
      },
    })
  ).current;

  useEffect(() => {
    // Ensure component is mounted before starting animations
    setIsReady(true);
    return () => setIsReady(false);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (visible) {
      setDragY(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, isReady]);

  if (!isReady) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={() => onClose?.()}
      statusBarTranslucent={Platform.OS === 'android'}
    >w
      <StatusBar 
        backgroundColor="rgba(0, 0, 0, 0.5)" 
        translucent={Platform.OS === 'android'} 
      />
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalWrapper,
            {
              transform: [{ 
                translateY: Animated.add(fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [SCREEN_HEIGHT, 0]
                }), dragY) 
              }],
              backgroundColor: theme.cardColor,
            },
          ]}
        >
          <View 
            {...panResponder.panHandlers}
            style={styles.dragHandle}
          >
            <View
              style={[styles.line, { backgroundColor: theme.iconColor }]}
            />
          </View>
          <CloseButton 
            style={styles.btnClose} 
            onPress={() => onClose?.()} 
          />
          <View style={[styles.contentContainer, style]}>
            {children}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  modalWrapper: {
    height: Platform.OS === 'android' ? SCREEN_HEIGHT * 0.5 : SCREEN_HEIGHT * 0.5,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: mystyles.borderRadius,
    borderTopRightRadius: mystyles.borderRadius,
    overflow: 'hidden',
  },
  dragHandle: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  line: {
    height: 4,
    width: 40,
    backgroundColor: colors.gray,
    borderRadius: 10,
  },
});