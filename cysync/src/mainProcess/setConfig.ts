import { app } from 'electron';

import config from '../config';

process.env.userDataPath = app.getPath('userData');
process.env.LOG_LEVEL = config.LOG_LEVEL;
process.env.BUILD_TYPE = config.BUILD_TYPE;
process.env.SERVER_ENV = config.SERVER_ENV;

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
if (process.env.NODE_ENV === 'production') {
  process.env.IS_PRODUCTION = 'true';
} else if (config.simulateProduction) {
  process.env.IS_PRODUCTION = 'true';
} else {
  process.env.IS_PRODUCTION = 'false';
}
