import React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './index';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>;
};
