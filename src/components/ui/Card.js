import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Card({ children, style, interactive = false, onPress }) {
  const theme = useTheme();
  const lift = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!interactive && !onPress}
      onPressIn={() => {
        if (!interactive && !onPress) return;
        lift.value = withTiming(-2, { duration: 150, easing: Easing.out(Easing.quad) });
      }}
      onPressOut={() => {
        if (!interactive && !onPress) return;
        lift.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
      }}
      onHoverIn={() => {
        if (!interactive && !onPress) return;
        lift.value = withTiming(-2, { duration: 150, easing: Easing.out(Easing.quad) });
      }}
      onHoverOut={() => {
        if (!interactive && !onPress) return;
        lift.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
      }}
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
        theme.shadow.card,
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    padding: 16,
  },
});
