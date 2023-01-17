import { StyledEngineProvider, Theme, ThemeProvider } from '@mui/material';
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

WebFont.load({
  google: {
    families: ['Lato:200,300,400,500,600,700', 'Droid Sans', 'Roboto']
  }
});

document.addEventListener('DOMContentLoaded', () =>
  render(
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
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
