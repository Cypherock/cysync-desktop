import { ipcRenderer } from 'electron';

import { ErrorObject } from '../constants/i18n';

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
 * @param errorMsg The error object.
 * @param onlySendText - If true, only the error message will be sent.
 * @returns
 */
const formatErrorMessage = (error: ErrorObject, onlySendText = false) => {
  const errorValues = Object.values(error);
  if (onlySendText) return error.message;
  return errorValues.join('\n');
};

// Run as soon as imported, to set the handler before other imports
setErrorHandler();

export { formatErrorMessage };
