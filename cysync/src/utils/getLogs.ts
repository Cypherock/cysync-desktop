import fs from 'fs';

const readFile = async (filename: string, maxSizeInMB = 1): Promise<string> => {
  return new Promise((resolve, reject) => {
    const maxSize = 1024 * 1024 * maxSizeInMB;
    try {
      const stats = fs.statSync(filename);
      if (!(stats && stats.size)) {
        throw new Error('Cannot read stats.');
      }
      const { size } = stats;
      let toSkip = 0;

      if (size < maxSize) {
        toSkip = 0;
      } else {
        toSkip = size - maxSize;
      }

      const readStream = fs.createReadStream(filename, { start: toSkip });

      const data: Buffer[] = [];

      readStream.on('data', (chunk: Buffer) => {
        data.push(chunk);
      });

      readStream.on('end', () => {
        resolve(Buffer.concat(data).toString('utf-8'));
      });

      readStream.on('error', err => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getDesktopLogs = async () => {
  try {
    return (await readFile(`${process.env.userDataPath}/CySync.log`)).split(
      '\n'
    );
  } catch (e) {
    return null;
  }
};

const getDeviceLogs = async () => {
  try {
    return (
      await readFile(`${process.env.userDataPath}/CypherockX1.log`)
    ).split('\n');
  } catch (e) {
    return null;
  }
};

export { getDesktopLogs, getDeviceLogs };
