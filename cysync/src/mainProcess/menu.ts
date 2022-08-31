import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';

import logger from './logger';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  private getMainWindow() {
    logger.info('Main Window in menu', {
      mainWindow: !!this.mainWindow,
      isDestroyed: this.mainWindow?.isDestroyed()
    });
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return this.mainWindow;
    }

    return undefined;
  }

  buildMenu() {
    this.setupWindowContextMenu();
    this.setupClickContextMenu();
  }

  private setupWindowContextMenu() {
    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupClickContextMenu() {
    this.getMainWindow()?.webContents.on('context-menu', (_, props) => {
      const template: object[] = this.buildDevClickContext(props);

      if (template)
        Menu.buildFromTemplate(template).popup({
          window: this.getMainWindow()
        });
    });
  }

  private buildDevClickContext(props: Electron.ContextMenuParams) {
    if (process.env.BUILD_TYPE === 'production') {
      return this.buildClickContext(props);
    }
    const { x, y } = props;
    const template = [
      ...this.buildClickContext(props),
      {
        label: 'Inspect element',
        click: () => {
          this.getMainWindow()?.webContents.inspectElement(x, y);
        }
      }
    ];

    return template;
  }

  private buildClickContext(_props: Electron.ContextMenuParams) {
    const template = [{ role: 'copy' }, { role: 'paste' }];

    return template;
  }

  private buildDarwinTemplate() {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'Electron',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:'
        }
      ]
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.getMainWindow()?.webContents.reload();
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.getMainWindow()?.setFullScreen(
              !this.getMainWindow()?.isFullScreen()
            );
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.getMainWindow()?.webContents.toggleDevTools();
          }
        }
      ]
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.getMainWindow()?.setFullScreen(
              !this.getMainWindow()?.isFullScreen()
            );
          }
        }
      ]
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };

    const subMenuView =
      process.env.BUILD_TYPE === 'debug' ? subMenuViewDev : subMenuViewProd;

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow];
  }

  private buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.getMainWindow()?.close();
            }
          }
        ]
      }
    ];

    if (process.env.BUILD_TYPE === 'debug') {
      templateDefault.push({
        label: '&View',
        submenu: [
          {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click: () => {
              this.getMainWindow()?.setFullScreen(
                !this.getMainWindow()?.isFullScreen()
              );
            }
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Alt+Ctrl+I',
            click: () => {
              this.getMainWindow()?.webContents.toggleDevTools();
            }
          }
        ]
      });
    }

    return templateDefault;
  }
}
