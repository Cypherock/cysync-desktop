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

/**
 * A util function to format error messages.
 * @param errorMsg The error message to format.
 * @param onlySendText - If true, only the error message will be sent.
 * @returns
 */
const formatErrorMessage = (errorMsg: string, onlySendText = false) => {
  const error = errorMsg.split('|');
  if (onlySendText) return error[1];
  return error.join('\n');
};

// Run as soon as imported, to set the handler before other imports
setErrorHandler();

export { formatErrorMessage };
