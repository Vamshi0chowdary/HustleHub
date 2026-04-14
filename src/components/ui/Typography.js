import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

function TypographyBase({
  children,
  style,
  color,
  numberOfLines,
  variantStyle,
}) {
  const theme = useTheme();

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles.base,
        variantStyle,
        { color: color || theme.colors.textPrimary, fontFamily: theme.typography.family },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Title(props) {
  const theme = useTheme();
  return <TypographyBase {...props} variantStyle={theme.typography.h1} />;
}

export function Subtitle(props) {
  const theme = useTheme();
  return <TypographyBase {...props} variantStyle={theme.typography.h3} color={props.color || theme.colors.textSecondary} />;
}

export function Body(props) {
  const theme = useTheme();
  return <TypographyBase {...props} variantStyle={theme.typography.body} color={props.color || theme.colors.textPrimary} />;
}

export function Caption(props) {
  const theme = useTheme();
  return <TypographyBase {...props} variantStyle={theme.typography.bodySm} color={props.color || theme.colors.textMuted} />;
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
