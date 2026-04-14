import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, spacing, radius, typography, motion, shadow } from './tokens';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const mode = system === 'dark' ? 'dark' : 'light';

  const value = useMemo(() => {
    const palette = colors[mode];
    return {
      mode,
      colors: palette,
      spacing,
      radius,
      typography,
      motion,
      shadow: shadow[mode],
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
}
