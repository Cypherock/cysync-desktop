/**
 * NOTE: This file is used in both main & renderer process
 */
import { feedback as feedbackServer } from '@cypherock/server-wrapper';

import packageJson from '../../package.json';

import { getDesktopLogs, getDeviceLogs } from './getLogs';
import { getSystemInfo } from './systemInfo';

const reportCrash = async ({
  subject,
  description,
  uuid,
  email
}: {
  subject: string;
  description: string;
  email: string;
  uuid?: string | null;
}) => {
  const data = {
    subject,
    description,
    email,
    desktopLogs: await getDesktopLogs(),
    deviceLogs: await getDeviceLogs(),
    systemInfo: await getSystemInfo(),
    appVersion: packageJson.version,
    uuid
  };

  if (process.env.NODE_ENV !== 'development') {
    await feedbackServer.crashReport(data);
  }
};

export default reportCrash;
