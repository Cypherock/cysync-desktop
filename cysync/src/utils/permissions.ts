import { exec } from 'child_process';
import fs from 'fs';
import sudo from 'sudo-prompt';

const fileLocation = '/tmp/cypherock';

const executeCommand = async (
  command: string,
  isSudo = false
): Promise<string> => {
  const e = isSudo ? sudo.exec : exec;
  return new Promise((resolve: any, reject: any) => {
    e(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      if (stderr) {
        reject(stderr);
        return;
      }
      resolve(stdout);
    });
  });
};

const isAddedToGroup = async () => {
  const groups = await executeCommand('groups $USER');
  return groups.search('dialout') !== -1;
};

const hasPermission = async () => {
  const inGroup = await isAddedToGroup();
  if (inGroup) return true;

  return false;
};

const restartRequired = async () => {
  const exist = fs.existsSync(fileLocation);
  return exist;
};

const addToGroup = async () => {
  await executeCommand('usermod -a -G dialout $USER', true);
  /**
   * On Low end pc write takes a little bit of time
   * adding a second delay will ensure this
   */
  return new Promise(resolve => {
    fs.open(fileLocation, 'w', () => {
      // empty
    });
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
};

const permissionStatus = async () => {
  const permission = await hasPermission();
  const isRestartRequired = await restartRequired();
  return {
    permission,
    restart: isRestartRequired
  };
};

const restart = async () => {
  executeCommand('shutdown -r now');
};

export { addToGroup, isAddedToGroup, restart, permissionStatus };
