import { DeprecatedThemeOptions } from '@mui/material/styles';

import colors from './colors';
import typography from './typography';

const theme: DeprecatedThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      light: '#161C23',
      main: '#0A1018',
      contrastText: '#ccc'
    },
    secondary: {
      main: colors.primary.darker,
      dark: '#C78D4E'
    },
    info: {
      main: '#8484F1',
      dark: '#4848F6'
    },
    warning: {
      main: '#ff9800',
      dark: '#f57c00'
    },
    text: {
      primary: '#CCCCCC',
      secondary: '#838282'
    },
    background: {
      paper: '#161C23',
      default: '#0B1018'
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

export default theme;
