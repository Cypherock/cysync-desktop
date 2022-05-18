import { execSync } from 'child_process';
import { BrowserWindow, dialog, screen } from 'electron';
import storage from 'electron-json-storage';
import log from 'electron-log';
import rimraf from 'rimraf';
import sudo from 'sudo-prompt';

import logger from './logger';

export const stopInterferingService = async (serviceName: string) => {
  if (process.platform !== 'linux') return undefined;
  return new Promise((resolve, reject) => {
    sudo.exec(
      `service ${serviceName} stop`,
      { name: 'node' },
      (error: any, stdout: any, stderr: any) => {
        error || stderr ? reject(error || stderr) : resolve(stdout);
      }
    );
  });
};

export const askToKillService = async (
  serviceName: string,
  minVersion: string
) => {
  if (process.platform !== 'linux') return;

  const hidePrompt: any = storage.getSync('hide_sudo_prompt');
  if (hidePrompt && hidePrompt.value) return;

  /*
  NOTE: Version checking won't work for services that do not implement a CLI,
  and require a different method to parse their version from stdout.
  */
  try {
    if (serviceName === 'ModemManager') {
      const serviceVersionStdout = execSync(`${serviceName} --version`, {
        encoding: 'utf-8'
      });
      const serviceVersion = serviceVersionStdout
        .slice(serviceName.length + 1)
        .trim();
      log.info(`${serviceName} version output:`, serviceVersion);
      if (serviceVersion >= minVersion) return;
    }

    const runningStatus = execSync(`systemctl status ${serviceName}.service`, {
      encoding: 'utf-8'
    });
    if (!runningStatus.includes('active (running)')) return;
    const sudoAccessGranted = await dialog.showMessageBox(null, {
      type: 'question',
      message: `cySync needs to stop the ${serviceName} service allow the app to function smoothly. Do you want to proceed?`,
      buttons: ['Allow', 'Deny (might cause errors)'],
      defaultId: 0,
      cancelId: 1,
      checkboxLabel: "Don't ask again"
    });

    if (sudoAccessGranted.checkboxChecked)
      storage.set('hide_sudo_prompt', { value: true }, error => {
        if (error) {
          log.error('Could not set hide_sudo_prompt.');
          log.error(error);
        }
      });

    if (sudoAccessGranted.response === 0)
      await stopInterferingService(serviceName);
  } catch (err) {
    log.error(`Couldn't stop the ${serviceName} service. ERR:`, err);
  }
};

export const rimrafPromise = (pathStr: string, options: rimraf.Options) => {
  return new Promise<void>((resolve, reject) => {
    rimraf(pathStr, options, error => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

export const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map(name => installer[name]),
      forceDownload
    )
    .catch(logger.error);
};

export const getAppWindowSize = () => {
  const widthRatio = 11,
    heightRatio = 8,
    minHeight = 800,
    minWidth = 1100;
  const { width: deviceWidth, height: deviceHeight } =
    screen.getPrimaryDisplay().workAreaSize;
  let reductionFactor = 1;
  let newHeight = 0,
    newWidth = 0;

  const differenceFactor = (deviceWidth - minWidth) / deviceWidth;

  if (differenceFactor > 0.3) reductionFactor = 0.7;
  else if (differenceFactor > 0.2) reductionFactor = 0.8;
  else if (differenceFactor > 0.1) reductionFactor = 0.9;

  newWidth = deviceWidth * reductionFactor;
  newHeight = (newWidth * heightRatio) / widthRatio;
  if (newHeight > deviceHeight) newHeight = deviceHeight;

  return {
    width: newWidth,
    height: newHeight,
    minWidth,
    minHeight
  };
};

export const fadeInWindow = (
  window: BrowserWindow,
  totalSteps = 20.0,
  totalTime = 200.0
) => {
  let currentOpacity = window.getOpacity();

  const timerID = setInterval(() => {
    if (!window || window.isDestroyed()) {
      clearInterval(timerID);
      return;
    }

    currentOpacity = currentOpacity + 1.0 / totalSteps;
    window.setOpacity(currentOpacity);
    if (currentOpacity > 1.0) {
      clearInterval(timerID);
    }
  }, totalTime / totalSteps);
};
