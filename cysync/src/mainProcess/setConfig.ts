import { app } from 'electron';

import jsonConfig from '../config.json';

const validateJsonConfig = () => {
  if (!jsonConfig.GITHUB_REPO) {
    throw new Error('Invalid GITHUB_REPO in json config');
  }

  if (!['production', 'debug'].includes(jsonConfig.BUILD_TYPE)) {
    throw new Error('Invalid BUILD_TYPE in json config');
  }

  if (
    !['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'].includes(
      jsonConfig.LOG_LEVEL
    )
  ) {
    throw new Error('Invalid LOG_LEVEL in json config');
  }

  // This changes between the different servers
  if (!['production', 'development', 'local'].includes(jsonConfig.SERVER_ENV)) {
    throw new Error('Invalid SERVER_ENV in json config');
  }

  // Build version is just the commit hash
  if (!jsonConfig.BUILD_VERSION) {
    throw new Error('No BUILD_VERSION in json config');
  }

  // When you want to enable production features on development (`yarn start`)
  if (typeof jsonConfig.SIMULATE_PRODUCTION !== 'boolean') {
    throw new Error('Invalid SIMULATE_PRODUCTION in json config');
  }

  // When you want to enable the donwload of prerelease firmware
  if (typeof jsonConfig.ALLOW_PRERELEASE !== 'boolean') {
    throw new Error('Invalid ALLOW_PRERELEASE in json config');
  }

  if (!jsonConfig.ANALYTICS_KEY) {
    throw new Error('Invalid ANALYTICS_KEY in json config');
  }
};

/**
 * `IS_PRODUCTION`:
 * This variable is used to enable or disable certain features depending on
 * if the app is in production mode or not.
 *
 * *********** Why not just use `NODE_ENV`? ************
 * We may want to simulate production environment in development mode.
 * In such cases, we can just set the `IS_PRODUCTION` to `true`.
 *
 * ******** When to use `NODE_ENV` and when to use `IS_PRODUCTION`? *********
 * `NODE_ENV`:
 * 1. Use to differentiate between development mode and production mode.
 * 2. We may have cases where different code works on different environments,
 *    such as path of icon etc. In these cases use `NODE_ENV`
 * 3. Use this to enable production features which you don't want to be simulated.
 *    Example: Crash Report, Analytics
 *
 * `IS_PRODUCTION`:
 * 1. Use to decide if we want to enable or disable a feature.
 * 2. Example: Websockets, Refresh on Startup etc.
 */
const setConfig = () => {
  process.env.userDataPath = app.getPath('userData');

  process.env.LOG_LEVEL = jsonConfig.LOG_LEVEL;
  process.env.BUILD_TYPE = jsonConfig.BUILD_TYPE;
  process.env.SERVER_ENV = jsonConfig.SERVER_ENV;
  process.env.GITHUB_REPO = jsonConfig.GITHUB_REPO;
  process.env.BUILD_VERSION = jsonConfig.BUILD_VERSION;
  process.env.ANALYTICS_KEY = jsonConfig.ANALYTICS_KEY;

  if (jsonConfig.ALLOW_PRERELEASE) {
    process.env.ALLOW_PRERELEASE = 'true';
  } else {
    process.env.ALLOW_PRERELEASE = 'false';
  }

  if (process.env.NODE_ENV === 'production') {
    process.env.IS_PRODUCTION = 'true';
  } else if (jsonConfig.SIMULATE_PRODUCTION) {
    process.env.IS_PRODUCTION = 'true';
  } else {
    process.env.IS_PRODUCTION = 'false';
  }
};

validateJsonConfig();
setConfig();
