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
  ipcMain,
  powerMonitor
} from 'electron';
import { download } from 'electron-dl';
import path from 'path';

import packageJson from '../package.json';

// Sets config variable on environment, must be set before any other import
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

let wcUri: string;
const handleMainProcessError = async (error: any, promise?: any) => {
  logger.error('Unhandled error on main process');
  logger.error(error);
  logger.error(promise);

  const title = 'Some error occurred, Contact cypherock for support.';
  let errorMsg = 'Unknown error';

  if (error) {
    if (error.message) {
      errorMsg = error.message;
    }

    if (error.stack) {
      errorMsg += '\n' + error.stack;
    }
  }

  logger.error(errorMsg);

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

logger.info('Starting Application', {
  defaultApp: process.defaultApp,
  args: process.argv
});
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('cypherock', process.execPath, [
      path.resolve(process.argv[1])
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('cypherock');
}

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

const handleUriOpen = async (uri: string) => {
  logger.info('Deep link uri', { uri });
  try {
    const newUrl = uri.startsWith('cypherock://') ? uri : 'cypherock://' + uri;
    const url = new URL(newUrl);

    // Handle wallet connect open
    if (url.host === 'wc') {
      const connectionString = url.searchParams.get('uri');

      if (connectionString && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('wallet-connect', connectionString);
      }
      wcUri = connectionString;
    }
  } catch (error) {
    logger.error('Error in handling URL');
    logger.error(error);
  }
};

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

  if (applicationLock) {
    app.on('second-instance', (_event, argv, workingDirectory) => {
      // Handle Deeplink for windows
      logger.info('Second instance opened', {
        commandLine: argv,
        workingDirectory
      });

      if (argv.length > 1) {
        // Only try this if there is an argv (might be redundant)
        if (process.platform === 'win32' || process.platform === 'linux') {
          try {
            handleUriOpen(argv[argv.length - 1].split('cypherock://')[1]);
          } catch {
            logger.error(`Direct link to file - FAILED: ${argv}`);
          }
        }
      }

      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }

  const loadingWindow = new BrowserWindow({
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

  loadingWindow.on('focus', () => {
    globalShortcut.registerAll(
      ['CommandOrControl+R', 'CommandOrControl+Shift+R', 'F5'],
      () => ({})
    );
  });

  loadingWindow.on('blur', () => {
    globalShortcut.unregister('CommandOrControl+R');
    globalShortcut.unregister('CommandOrControl+Shift+R');
    globalShortcut.unregister('F5');
  });

  logger.info(
    `Starting up Cysync with Package Version: ${packageJson.version}, Build Version ${process.env.BUILD_VERSION}`
  );
  logger.info('Opening loading screen');
  loadingWindow.once('show', async () => {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      await installExtensions();
    }

    const { width, height, minWidth, minHeight } = getAppWindowSize();

    logger.info(`New Window According to Aspect Ratio: ${width}, ${height}`);

    logger.info('Opening main screen');

    logger.info('Config variables', {
      log_level: process.env.LOG_LEVEL,
      build_type: process.env.BUILD_TYPE,
      server_env: process.env.SERVER_ENV,
      github_repo: process.env.GITHUB_REPO,
      allow_prerelease: process.env.ALLOW_PRERELEASE,
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
    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        if (details.url.startsWith('https://api.coingecko.com/')) {
          const keys = Object.keys(details.responseHeaders);

          const index = keys
            .map(e => e.toLowerCase())
            .findIndex(e => e === 'Access-Control-Allow-Origin'.toLowerCase());

          if (index !== -1) {
            delete details.responseHeaders[keys[index]];
          }

          const headers = {
            responseHeaders: {
              'Access-Control-Allow-Origin': ['*'],
              ...details.responseHeaders
            }
          };
          callback(headers);
        } else {
          callback({ responseHeaders: details.responseHeaders });
        }
      }
    );

    powerMonitor.on('lock-screen', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('lock-screen');
      }
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

      if (mainWindow.isDestroyed()) {
        return;
      }
      if (process.env.START_MINIMIZED) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    mainWindow.on('close', (e: Electron.Event) => {
      if (!mainWindow || mainWindow.isDestroyed()) {
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

            if (mainWindow !== null && !mainWindow.isDestroyed()) {
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

      if (mainWindow.isDestroyed()) {
        return;
      }

      mainWindow.show();
      fadeInWindow(mainWindow);
      // Deep linking for when the app is not running already (Windows, Linux)
      if (process.platform === 'win32' || process.platform === 'linux') {
        logger.info({ argv: process.argv });
        const { argv } = process;
        const uri = argv.filter(arg => arg.startsWith('cypherock://'));
        if (uri.length) {
          handleUriOpen(uri[0]);
        }
      }

      if (loadingWindow && !loadingWindow.isDestroyed()) {
        loadingWindow.hide();
        loadingWindow.destroy();
      }
    });

    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then();

    if (isDevelopment) mainWindow.webContents.openDevTools();
  });

  loadingWindow.once('ready-to-show', () => {
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.show();
      fadeInWindow(loadingWindow);
    }
  });

  loadingWindow.loadURL(LOADING_WINDOW_WEBPACK_ENTRY);

  if (isDevelopment) loadingWindow.webContents.openDevTools();

  ipcMain.on('exit-app', () => {
    app.showExitPrompt = false;
    app.preventExit = false;
    app.quit();
  });

  ipcMain.handle('wc-url-init', () => {
    return wcUri;
  });

  ipcMain.on('download', (_event, info) => {
    logger.info('Downloading Update');

    if (mainWindow === null) {
      throw new Error('Main window is not defined');
    }

    if (mainWindow.isDestroyed()) {
      return;
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

  ipcMain.on('focus', () => {
    if (mainWindow === null) {
      throw new Error('Main window is not defined');
    }

    if (mainWindow.isDestroyed()) {
      return;
    }

    mainWindow.show();
  });

  ipcMain.on('clear-data', async () => {
    if (mainWindow === null) {
      throw new Error('Main window is not defined');
    }

    if (mainWindow.isDestroyed()) {
      return;
    }

    try {
      const databasePath = path.join(app.getPath('userData'), 'databases');
      const currentWindow = mainWindow;
      await currentWindow.webContents.session.clearStorageData();
      await currentWindow.webContents.session.clearCache();
      await rimrafPromise(databasePath, {});
    } catch (error) {
      logger.error(error);
    } finally {
      app.relaunch();
      app.exit(0);
    }
  });
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

app.on('will-finish-launching', () => {
  app.on('open-url', (event, url) => {
    // Handle deeplink for macos
    logger.info({ event, url });
    event.preventDefault();

    handleUriOpen(url);
  });
});
