import { dialog } from 'electron';
import logger from 'electron-log';

import reportCrashToServer from '../utils/reportCrash';

export const reportCrash = async ({
  description,
  uuid
}: {
  description: any;
  uuid: any;
}) => {
  try {
    await reportCrashToServer({
      subject: 'Crash Report',
      description,
      uuid,
      email: ''
    });
  } catch (error) {
    logger.error('Error while reporting crash.');
    logger.error(error.response);
  }
};

let showErrorTimeout: NodeJS.Timeout | null = null;
const allErrors: string[] = [];

const handleTimeout = (uuid: any) => {
  const title = 'Some error occurred, Please contact cypherock for support.';
  const body = allErrors.join('\n\n');

  dialog.showErrorBox(title, body);
  reportCrash({ description: body, uuid });
};

export const handleError = (errors: any) => {
  let body = '';

  if (showErrorTimeout) {
    clearTimeout(showErrorTimeout);
    showErrorTimeout = null;
  }

  if (errors.error) {
    body += `Error: ${errors.error}\n`;
  }

  if (errors.url) {
    body += `Path: ${errors.url}\n`;
  }

  if (errors.line) {
    body += `Line: ${errors.line}\n`;
  }

  allErrors.push(body);
  showErrorTimeout = setTimeout(() => handleTimeout(errors.uuid), 1000);
};
