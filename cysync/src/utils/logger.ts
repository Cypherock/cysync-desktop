import winston from 'winston';

const loggerConfig: any = {
  console: new winston.transports.Console()
};

const transports = [loggerConfig.console];

if (process.env.userDataPath) {
  loggerConfig.file = new winston.transports.File({
    filename: `${process.env.userDataPath}/CySync.log`
  });
  transports.push(loggerConfig.file);
}

/**
 * This method helps overriding {winston} log level transport on the fly
 *
 * @example
 * ```typescript
 * import {logLevel} from '@cypherock/communication'
 * logLevel(6) // show all
 * ```
 *
 * @param level - Log level 0-6
 * @return
 */
const logLevel = (level: number): void => {
  const levels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
  loggerConfig.console.level = levels[level];
};

export default winston.createLogger({
  format: winston.format.combine(
    winston.format(info => {
      let newInfo = { ...info };

      // If `toJSON` is present, timestamp fails to be added
      if (newInfo.toJSON) {
        delete newInfo.toJSON;
      }

      if (info instanceof Error) {
        newInfo = {
          ...newInfo,
          level: info.level,
          message: info.message,
          stack: info.stack
        };
      }

      return newInfo;
    })(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'CySync' },
  transports
});

export { logLevel };
