import { Button, ButtonProps } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';

import colors from '../../designConstants/colors';

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          background: '#71624C',
          color: '#FFFFFF',
          textTransform: 'none',
          '&:hover': {
            background: colors.primary.dark
          },
          '&.Mui-disabled': {
            backgroundColor: `${colors.text.secondary} !important`,
            color: `${colors.secondary.main} !important`,
            cursor: 'not-allowed !important'
          }
        }
      }
    }
  }
});

const NewButton = (props: ButtonProps) => {
  const { color } = props;

  if (!color || color === 'primary')
    return (
      <ThemeProvider theme={theme}>
        <Button {...props} />
      </ThemeProvider>
    );

  return <Button {...props} />;
};

export default NewButton;
