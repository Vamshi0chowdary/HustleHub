import React, { useEffect } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

export default function Input({
  label,
  error,
  style,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) {
  const theme = useTheme();
  const focused = useSharedValue(0);

  useEffect(() => {
    if (error) {
      focused.value = withTiming(1, {
        duration: 160,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [error]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focused.value,
      [0, 1],
      [theme.colors.inputBorder, error ? theme.colors.danger : theme.colors.accent]
    ),
  }));

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text> : null}
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.inputBg,
            borderRadius: theme.radius.md,
          },
          animatedContainerStyle,
          style,
        ]}
      >
        <TextInput
          {...props}
          autoCorrect={false}
          autoCapitalize={props.autoCapitalize || 'none'}
          keyboardAppearance={theme.mode === 'dark' ? 'dark' : 'light'}
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accent}
          style={[styles.input, { color: theme.colors.textPrimary }, inputStyle]}
          onFocus={(e) => {
            focused.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            focused.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
            if (onBlur) onBlur(e);
          }}
        />
      </Animated.View>
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 2,
  },
  container: {
    borderWidth: 1,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0,
  },
  error: {
    marginTop: 8,
    marginLeft: 2,
    fontSize: 13,
    fontWeight: '500',
  },
});
