import axios from 'axios';
import {
  app,
  AutoUpdater,
  autoUpdater,
  ipcMain,
  shell,
  WebContents
} from 'electron';
import os from 'os';
import { format } from 'util';

import packageJson from '../../package.json';

import logger from './logger';

const currentVersion = app.getVersion();

const host = 'https://update.electronjs.org';

export default class Updater {
  private updater: AutoUpdater;

  private checkingForUpdate: boolean;

  private foundUpdate: boolean;

  private latestReleaseUrl: string;

  private githubReleaseUrl: string;

  private renderer: WebContents;

  private interval: NodeJS.Timeout;

  private hasAutoUpdateFeature = process.platform !== 'linux';

  constructor(mainWindow: WebContents) {
    this.checkingForUpdate = false;
    this.foundUpdate = false;
    this.renderer = mainWindow;
    this.updater = autoUpdater;
    this.githubReleaseUrl = `https://api.github.com/repos/${process.env.GITHUB_REPO}/releases/latest`;
    this.latestReleaseUrl = `${host}/${process.env.GITHUB_REPO}/${
      process.platform
    }-${process.arch}/${app.getVersion()}`;
    this.setupConfig();
  }

  private setupConfig() {
    const userAgent = format(
      '%s/%s (%s: %s)',
      packageJson.name,
      packageJson.version,
      os.platform(),
      os.arch()
    );
    logger.info({ latestReleaseUrl: this.latestReleaseUrl, userAgent });
    this.updater.setFeedURL({
      url: this.latestReleaseUrl,
      headers: { 'User-Agent': userAgent }
    });
  }

  public setupListeners() {
    this.updater.on('error', error => {
      logger.error(error);
      this.onError(error);
    });

    this.updater.on('checking-for-update', () => {
      logger.info('AppUpdater: Checking for update and downloading...');
    });

    this.updater.on('update-available', (_info: any) => {
      logger.info('AppUpdater: Update available downloading...');
    });

    this.updater.on('update-not-available', () => {
      logger.info('AppUpdater: Update not available');
      this.updateNotAvailable();
    });

    this.updater.on('update-downloaded', () => {
      logger.info('AppUpdater: Update downloaded');
      this.downloadComplete();
    });

    ipcMain.on('check-for-update', () => {
      logger.info('AppUpdater: Initiated checking for update');
      this.initiateUpdateChecks();
    });

    ipcMain.on('start-update', () => {
      logger.info('AppUpdater: Updating application approved');
      if (this.hasAutoUpdateFeature) {
        this.startUpdating();
        this.downloadProgress(0);
      } else {
        shell.openExternal(`https://www.cypherock.com/gs`);
      }
    });

    ipcMain.on('install-update', () => {
      logger.info('AppUpdater: Installing application');
      this.updater.quitAndInstall();
    });
  }

  private initiateUpdateChecks() {
    if (this.interval) {
      clearInterval(this.interval);
    } else {
      this.checkForUpdates();
    }

    this.interval = setInterval(
      this.checkForUpdates.bind(this),
      10 * 60 * 1000
    );
  }

  private checkForUpdates() {
    // Use this for testing
    // const updateInfo = { version: '1.4.0' };
    // setTimeout(() => this.updateAvailable(updateInfo), 1000);
    // return;

    // This check is so that 2 simultanious update flows does not take place
    if (this.checkingForUpdate) {
      logger.warn('Already checking for update.');
      this.renderer.send('duplicate-update');
      return;
    }

    if (this.foundUpdate) {
      if (this.interval) {
        clearInterval(this.interval);
      }
      return;
    }

    this.checkingForUpdate = true;

    axios
      .get(
        this.hasAutoUpdateFeature
          ? this.latestReleaseUrl
          : this.githubReleaseUrl
      )
      .then(resp => {
        logger.info(resp.data);
        logger.info(currentVersion);
        if (resp && resp.status === 200) {
          if (!this.hasAutoUpdateFeature) {
            let tagName: string = resp?.data?.tag_name;
            if (tagName) {
              if (tagName.startsWith('v')) {
                tagName = tagName.slice(1);
              }

              if (tagName !== currentVersion) {
                this.foundUpdate = true;
                this.updateAvailable({
                  version: resp.data.tag_name
                });
              }
            }
          } else {
            this.foundUpdate = true;
            this.updateAvailable({
              version: resp.data.name,
              notes: resp.data.notes
            });
          }
        }

        if (!this.foundUpdate) {
          this.foundUpdate = false;
          this.updateNotAvailable();
        }
      })
      .catch(() => {
        this.updateNotAvailable();
      });
  }

  private updateNotAvailable() {
    this.checkingForUpdate = false;
    this.renderer.send('update-unavailable');
  }

  private startUpdating() {
    if (!this.hasAutoUpdateFeature) {
      return;
    }

    logger.info('Downloading update...');
    this.renderer.send('update-downloading');
    this.updater.checkForUpdates();
  }

  private updateAvailable(info: any) {
    logger.info('Update available.', { info });
    this.foundUpdate = true;
    this.renderer.send('update-available', info);
  }

  private downloadProgress(percent: number) {
    logger.info(`Download progress ${percent}`);
    this.renderer.send('update-download-progress', percent);
  }

  private downloadComplete() {
    logger.info('Download completed');
    this.renderer.send('update-downloaded');
  }

  private onError(error: any) {
    this.checkingForUpdate = false;
    logger.error('Error on update', error);
    this.renderer.send('update-error', error);
  }
}
