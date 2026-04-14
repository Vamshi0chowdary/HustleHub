import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

export default function Screen({ children, style, contentStyle, gradient = true }) {
  const theme = useTheme();
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, {
      duration: theme.motion.duration,
      easing: Easing.inOut(Easing.quad),
    });
  }, [opacity, theme.motion.duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const gradientColors =
    theme.mode === 'light'
      ? ['#FAFAFB', '#F3F4F6']
      : ['#0B0B0F', '#12121A'];

  return (
    <Animated.View style={[styles.root, animatedStyle]}>
      <LinearGradient colors={gradient && gradientColors ? gradientColors : [theme.colors.background, theme.colors.background]} style={[styles.root, style]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.content, { backgroundColor: 'transparent' }, contentStyle]}>{children}</View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
