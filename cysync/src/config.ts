interface GlobalConfig {
  BUILD_TYPE: 'production' | 'debug';
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
  // This changes between the different servers
  SERVER_ENV?: 'production' | 'development' | 'local';
  // When you want to enable production features on development (`yarn start`)
  simulateProduction?: boolean;
}

const releaseConfig: GlobalConfig = {
  BUILD_TYPE: 'production',
  LOG_LEVEL: 'info'
};

const testConfig: GlobalConfig = {
  BUILD_TYPE: 'debug',
  LOG_LEVEL: 'silly'
};

const configs = {
  release: releaseConfig,
  test: testConfig
};

/*
 * Usage:
 * configs.test: Test builds
 * configs.release: Production builds
 */
export default configs.test;
