import winston from 'winston';

const loggerConfig: any = {
  console: new winston.transports.Console({ format: winston.format.cli() })
};

const transports = [loggerConfig.console];

if (process.env.userDataPath) {
  loggerConfig.file = new winston.transports.File({
    filename: `${process.env.userDataPath}/CySync.log`,
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
    )
  });
  transports.push(loggerConfig.file);
}

export default winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'CySyncMain' },
  transports
});
