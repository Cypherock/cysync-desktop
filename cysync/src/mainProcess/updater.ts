import axios from 'axios';
import { ipcMain, WebContents } from 'electron';
import autoUpdater from 'update-electron-app';

import packageJson from '../../package.json';

const currentVersion = packageJson.version;

import logger from './logger';

export default class Updater {
  private checkingForUpdate: boolean;
  private autoUpdateInitiated: boolean;
  private latestReleaseUrl: string;

  private renderer: WebContents;

  constructor(mainWindow: WebContents) {
    this.checkingForUpdate = false;
    this.autoUpdateInitiated = false;
    this.renderer = mainWindow;
    this.latestReleaseUrl = `https://api.github.com/repos/${process.env.GITHUB_REPO}/releases/latest`;
  }
  private async startAutoUpdate() {
    if (
      this.isAutoupdateAvailable() &&
      !this.autoUpdateInitiated &&
      process.env.NODE_ENV !== 'development'
    ) {
      logger.info('Starting autoupdate');
      this.autoUpdateInitiated = true;
      autoUpdater({
        repo: process.env.GITHUB_REPO,
        // Winston logger is incompatable with `update-electron-app`, thus it needs to be modified.
        logger: {
          log: (...args: any) => {
            if (args.length > 0) {
              logger.info(args[0], { params: args.slice(1) });
            }
          },
          info: (...args: any) => {
            if (args.length > 0) {
              logger.info(args[0], { params: args.slice(1) });
            }
          },
          error: (...args: any) => {
            if (args.length > 0) {
              logger.error(args[0], { params: args.slice(1) });
            }
          },
          warn: (...args: any) => {
            if (args.length > 0) {
              logger.warn(args[0], { params: args.slice(1) });
            }
          }
        },

        notifyUser: true
      });
    }
  }

  private isAutoupdateAvailable() {
    // Autoupdater is only available for windows and Mac for now
    return process.platform && ['darwin', 'win32'].includes(process.platform);
  }

  public setupListeners() {
    ipcMain.on('check-for-update', () => {
      this.checkForUpdates();
    });

    ipcMain.on('check-auto-update', () => {
      this.startAutoUpdate();
    });
  }

  private async checkForUpdates() {
    // This check is so that 2 simultanious update flows does not take place
    if (this.checkingForUpdate) {
      logger.info('Already checking for update.');
      this.renderer.send('duplicate-update');
      return;
    }

    this.checkingForUpdate = true;

    axios
      .get(this.latestReleaseUrl)
      .then(resp => {
        let tagName: string = resp?.data?.tag_name;
        if (tagName) {
          if (tagName.startsWith('v')) {
            tagName = tagName.slice(1);
          }

          if (tagName !== currentVersion) {
            this.updateAvailable({
              version: resp.data.tag_name
            });
          }
          return;
        }

        this.updateNotAvailable();
      })
      .catch(error => {
        logger.error(error);
        this.updateNotAvailable();
      });
  }

  private updateAvailable(info: { version: string }) {
    this.checkingForUpdate = false;
    logger.info('Update available.');
    this.renderer.send('update-available', info);
  }

  private updateNotAvailable() {
    this.checkingForUpdate = false;
    logger.info('Update not available.');
    this.renderer.send('update-unavailable');
  }
}
