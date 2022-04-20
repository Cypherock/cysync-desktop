import { StyledEngineProvider, Theme, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import 'electron-disable-file-drop';
import React from 'react';
import { render } from 'react-dom';
import 'react-virtualized/styles.css';
import WebFont from 'webfontloader';

import './app.global.css';
import theme from './designSystem/designConstants/theme';
import ErrorBoundary from './errorBoundary';
import PermissionSetup from './pages/PermissionSetup';
import { I18nProvider } from './store/provider';
import Analytics from './utils/analytics';
import './utils/errorHandler';

declare module '@mui/styles/defaultTheme' {
  /* tslint:disable-next-line */
  interface DefaultTheme extends Theme {}
}

const instance = Analytics.Instance;
instance.setup();

const cySyncTheme = createTheme(theme);

WebFont.load({
  google: {
    families: ['Lato', 'Droid Sans', 'Roboto']
  }
});

document.addEventListener('DOMContentLoaded', () =>
  render(
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={cySyncTheme}>
        <I18nProvider>
          <ErrorBoundary>
            <PermissionSetup />
          </ErrorBoundary>
        </I18nProvider>
      </ThemeProvider>
    </StyledEngineProvider>,
    document.getElementById('root')
  )
);
