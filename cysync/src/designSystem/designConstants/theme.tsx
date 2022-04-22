import { createTheme, ThemeOptions } from '@mui/material/styles';

import colors from './colors';
import typography from './typography';

const theme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      light: colors.secondary.light,
      main: colors.secondary.main,
      contrastText: colors.secondary.contrastText
    },
    secondary: {
      main: colors.primary.darker,
      dark: colors.primary.dark
    },
    info: {
      main: colors.info.main,
      dark: colors.info.dark
    },
    warning: {
      main: colors.warning.main,
      dark: colors.warning.dark
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary
    },
    background: {
      paper: colors.background.paper,
      default: colors.background.default
    },
    contrastThreshold: 3,
    tonalOffset: 0.2
  },
  typography: {
    fontFamily: 'Lato, Droid-Sans, Roboto, sans-serif',
    h1: {
      fontSize: typography.h1
    },
    h2: {
      fontSize: typography.h2
    },
    h3: {
      fontSize: typography.h3
    },
    h4: {
      fontSize: typography.h4
    },
    h5: {
      fontSize: typography.h5
    },
    h6: {
      fontSize: typography.h6
    }
  }
};

export default createTheme(theme);
