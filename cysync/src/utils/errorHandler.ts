import { ipcRenderer } from 'electron';

import logger from './logger';
import getUUID from './uuid';

const setErrorHandler = () => {
  window.onerror = async (error, url, line) => {
    if ((error as string)?.includes('Writing to COM port')) {
      logger.warn('Ignoring COM port error in error handler');
      return;
    }

    if (
      (error as string)?.toLowerCase().includes('ResizeObserver'.toLowerCase())
    ) {
      logger.warn('Ignoring ResizeObserver error in error handler');
      logger.warn(error);
      return;
    }

    const userId = await getUUID();
    logger.error('Error caught in error handler', {
      error,
      url,
      line,
      uuid: userId
    });
    ipcRenderer.send('renderer-error', {
      error,
      url,
      line,
      uuid: userId
    });
  };
};

// Run as soon as imported, to set the handler before other imports
setErrorHandler();
