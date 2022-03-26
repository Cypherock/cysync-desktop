import { ipcRenderer } from 'electron';

import logger from './logger';
import getUUID from './uuid';

const setErrorHandler = () => {
  window.onerror = async (error, url, line) => {
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
