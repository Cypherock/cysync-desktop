import { ThemeProvider } from '@material-ui/core';
import { createTheme } from '@material-ui/core/styles';
import 'electron-disable-file-drop';
import React, { Fragment } from 'react';
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

const instance = Analytics.Instance;
instance.setup();

const AppContainer = Fragment;

const cySyncTheme = createTheme(theme);

WebFont.load({
  google: {
    families: ['Lato', 'Droid Sans', 'Roboto']
  }
});

document.addEventListener('DOMContentLoaded', () =>
  render(
    <AppContainer>
      <ThemeProvider theme={cySyncTheme}>
        <I18nProvider>
          <ErrorBoundary>
            <PermissionSetup />
          </ErrorBoundary>
        </I18nProvider>
      </ThemeProvider>
    </AppContainer>,
    document.getElementById('root')
  )
);
