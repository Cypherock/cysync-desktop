/**
 * This module executes inside of electron's main process.
 */
import {
  App,
  app as internalApp,
  BrowserWindow,
  crashReporter,
  dialog,
  globalShortcut,
  ipcMain
} from 'electron';
import { download } from 'electron-dl';
import path from 'path';

import packageJson from '../package.json';

// Sets config variable on envirnment, must be set before any other import
import './mainProcess';
import { handleError, reportCrash } from './mainProcess/crashReporter';
import logger from './mainProcess/logger';
import MenuBuilder from './mainProcess/menu';
import AppUpdater from './mainProcess/updater';
import {
  askToKillService,
  fadeInWindow,
  getAppWindowSize,
  installExtensions,
  rimrafPromise
} from './mainProcess/utils';

import { dbs } from './store/database';

const handleMainProcessError = async (error: any) => {
  logger.error('Unhandled error on main process');
  logger.error(error);

  const title = 'Some error occurred, Please contact cypherock for support.';
  let errorMsg = 'Unknown error';

  if (error) {
    if (error.message) {
      errorMsg = error.message;
    }

    if (error.stack) {
      errorMsg += '\n' + error.stack;
    }
  }

  reportCrash({ description: errorMsg, uuid: undefined });

  dialog.showErrorBox(title, errorMsg);

  app.exit(1);
};

process.on('uncaughtException', handleMainProcessError);
process.on('unhandledRejection', handleMainProcessError);

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const LOADING_WINDOW_WEBPACK_ENTRY: string;

/**
 * Adding 2 new variable to app
 */
interface CustomApp extends App {
  // Shows exit prompt
  showExitPrompt: boolean;

  // Prevent the application from exit
  preventExit: boolean;
}

const app: CustomApp = internalApp as CustomApp;

app.showExitPrompt = true;
app.preventExit = false;

// Locks the current application instance.
const applicationLock = app.requestSingleInstanceLock();

// If unable to get the lock, then the application is already running.
if (!applicationLock) {
  app.quit();
  logger.info('An instance of CyCync is already running.');
  process.exit(0);
}

/* tslint:disable-next-line */
if (require('electron-squirrel-startup')) {
  app.quit();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

crashReporter.start({
  companyName: 'Cypherock',
  submitURL: 'http://15.206.80.43/',
  uploadToServer: true,
  ignoreSystemCrashHandler: true
});

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  /* tslint:disable-next-line */
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  /* tslint:disable-next-line */
  require('electron-debug')();
}

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  // This works for windows and mac
  let iconPath = './icon.png';

  if (process.platform === 'linux') {
    // For linux in development, we need to provide the exact path
    if (process.env.NODE_ENV === 'development') {
      iconPath = path.join(__dirname, '../', 'resources', 'icon.png');
      // For linux in production, the icon name and location changes
    } else {
      iconPath = path.join(__dirname, '../', '../', `${packageJson.name}.png`);
    }
  }

  const loading = new BrowserWindow({
    show: false,
    frame: false,
    opacity: 0,
    width: 600,
    height: 400,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (process.env.NODE_ENV === 'development' && process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, '../../src/icon.png'));
  }

  loading.on('focus', () => {
    globalShortcut.registerAll(
      ['CommandOrControl+R', 'CommandOrControl+Shift+R', 'F5'],
      () => ({})
    );
  });

  loading.on('blur', () => {
    globalShortcut.unregister('CommandOrControl+R');
    globalShortcut.unregister('CommandOrControl+Shift+R');
    globalShortcut.unregister('F5');
  });

  logger.info('Opening loading screen');
  loading.once('show', async () => {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      await installExtensions();
    }

    let { width, height, minWidth, minHeight } = getAppWindowSize();

    if (width < 1100) {
      width = 1100;
      height = 800;
      minWidth = 1100;
      minHeight = 800;
    }

    logger.info('New Window According to Aspect Ratio: ', width, height);

    logger.info('Opening main screen');

    logger.info('Config variables', {
      log_level: process.env.LOG_LEVEL,
      build_type: process.env.BUILD_TYPE,
      server_env: process.env.SERVER_ENV,
      github_repo: process.env.GITHUB_REPO,
      node_env: process.env.NODE_ENV
    });

    mainWindow = new BrowserWindow({
      show: false,
      opacity: 0,
      width,
      height,
      minWidth,
      minHeight,
      resizable: true,
      minimizable: true,
      maximizable: true,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      icon: iconPath
    });

    mainWindow.on('focus', () => {
      globalShortcut.registerAll(
        ['CommandOrControl+R', 'CommandOrControl+Shift+R', 'F5'],
        () => ({})
      );
    });

    mainWindow.on('blur', () => {
      globalShortcut.unregister('CommandOrControl+R');
      globalShortcut.unregister('CommandOrControl+Shift+R');
      globalShortcut.unregister('F5');
    });

    mainWindow.webContents.on('did-finish-load', () => {
      if (!mainWindow) {
        throw new Error('"mainWindow" is not defined');
      }
      if (process.env.START_MINIMIZED) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    mainWindow.on('close', (e: Electron.Event) => {
      if (mainWindow === null) {
        return;
      }

      if (app.preventExit) {
        e.preventDefault();
        return;
      }

      if (app.showExitPrompt) {
        e.preventDefault();

        dialog
          .showMessageBox(mainWindow, {
            type: 'warning',
            buttons: ['Cancel', 'Yes'],
            title: 'Close Application?',
            message: 'Are you sure you want to close the application?',
            cancelId: 0,
            defaultId: 0,
            noLink: true
          })
          .then(val => {
            if (val.response === 0) {
              return;
            }

            if (mainWindow !== null) {
              app.showExitPrompt = false;
              app.preventExit = true;
              mainWindow.webContents.send('on-exit');

              // Timeout if the exit cleanup is stuck
              setTimeout(() => {
                app.showExitPrompt = false;
                app.preventExit = false;
                app.quit();
              }, 5000);
            }
          })
          .catch(logger.error);
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    const appUpdater = new AppUpdater(mainWindow.webContents);
    appUpdater.setupListeners();

    const menu = new MenuBuilder(mainWindow);
    menu.buildMenu();

    mainWindow.once('ready-to-show', async () => {
      logger.info('Main screen loaded');

      if (!mainWindow) {
        throw new Error('No main window present');
      }

      mainWindow.show();
      fadeInWindow(mainWindow);
      loading.hide();
      loading.destroy();
    });

    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then();

    if (isDevelopment) mainWindow.webContents.openDevTools();
  });

  loading.once('ready-to-show', () => {
    loading.show();
    fadeInWindow(loading);
  });

  loading.loadURL(LOADING_WINDOW_WEBPACK_ENTRY);

  if (isDevelopment) loading.webContents.openDevTools();

  ipcMain.on('exit-app', () => {
    app.showExitPrompt = false;
    app.preventExit = false;
    app.quit();
  });

  ipcMain.on('download', (_event, info) => {
    logger.info('Downloading Update');

    if (mainWindow === null) {
      throw new Error('Main window is not defined');
    }

    const currentWindow = mainWindow;

    download(mainWindow, info.url, info.properties)
      .then(dl => {
        return currentWindow.webContents.send(
          'download complete',
          dl.getSavePath()
        );
      })
      .catch(e => {
        logger.error(e);
        return currentWindow.webContents.send('download error', e);
      });
  });

  ipcMain.on('renderer-error', (_event, errors) => {
    handleError(errors);
  });

  ipcMain.on('clear-data', async () => {
    if (mainWindow === null) {
      throw new Error('Main window is not defined');
    }

    try {
      const databasePath = path.join(app.getPath('userData'), 'databases');
      const currentWindow = mainWindow;
      await currentWindow.webContents.session.clearStorageData();
      await currentWindow.webContents.session.clearCache();
      await rimrafPromise(databasePath, {});
      app.relaunch();
    } catch (error) {
      logger.error(error);
    } finally {
      app.exit(0);
    }
  });

  ipcMain.handle(
    'database',
    async (_, dbName: any, fnName: string, arg: any) => {
      const results = await (dbs as any)[dbName][fnName](arg);
      return results;
    }
  );
};

app.on('ready', async () => {
  if (process.platform === 'linux')
    await askToKillService('ModemManager', '1.12.0');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().then();
  }
});
