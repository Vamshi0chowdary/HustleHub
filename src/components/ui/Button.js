import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(disabled ? 1 : 1, {
      duration: theme.motion.duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [disabled, theme.motion.duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const colors =
    variant === 'secondary'
      ? {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          textColor: theme.colors.textPrimary,
        }
      : {
          backgroundColor: theme.colors.accent,
          borderColor: theme.colors.accent,
          textColor: '#FFFFFF',
        };

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withTiming(isDisabled ? 1 : theme.motion.pressScale, {
          duration: 120,
          easing: Easing.out(Easing.quad),
        });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {
          duration: 160,
          easing: Easing.out(Easing.quad),
        });
      }}
      style={[
        styles.button,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderRadius: theme.radius.md,
          opacity: isDisabled ? 0.6 : 1,
        },
        theme.shadow.card,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textColor} />
      ) : (
        <Text style={[styles.text, { color: colors.textColor }, textStyle]}>{title}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
