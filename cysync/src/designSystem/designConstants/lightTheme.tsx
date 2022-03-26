import typography from './typography';

const lightTheme = {
  palette: {
    primary: {
      light: '#ccc',
      main: '#fff',
      contrastText: '#ccc'
    },
    secondary: {
      main: '#000'
    },
    info: {
      light: '#8484F1',
      main: '#4848F6'
    },
    text: {
      primary: '#000',
      secondary: '#0f0f0f'
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
    },
    display1: {
      fontSize: typography.display1
    },
    tinyText: {
      fontSize: typography.tinyText
    }
  }
};

export default lightTheme;
