const path = require("path");
const fs = require("fs");
const os = require("os");
const childProcess = require("child_process");

const BRANCH_OR_TAG_NAME = process.env.GITHUB_REF_NAME;

const BUILD_TYPE_CONFIG = {
  dev: {
    BUILD_TYPE: "debug",
    LOG_LEVEL: "silly",
    SERVER_ENV: "development",
    GITHUB_REPO: "Cypherock/cysync-desktop-dev",
    ALLOW_PRERELEASE: true,
    SIMULATE_PRODUCTION: false,
  },
  debug: {
    BUILD_TYPE: "production",
    LOG_LEVEL: "silly",
    SERVER_ENV: "production",
    GITHUB_REPO: "Cypherock/cysync-desktop-debug",
    ALLOW_PRERELEASE: true,
    SIMULATE_PRODUCTION: false,
  },
  rc: {
    BUILD_TYPE: "production",
    LOG_LEVEL: "info",
    SERVER_ENV: "production",
    GITHUB_REPO: "Cypherock/cysync-desktop-rc",
    ALLOW_PRERELEASE: false,
    SIMULATE_PRODUCTION: false,
  },
  prod: {
    BUILD_TYPE: "production",
    LOG_LEVEL: "info",
    SERVER_ENV: "production",
    GITHUB_REPO: "Cypherock/cysync-desktop",
    ALLOW_PRERELEASE: false,
    SIMULATE_PRODUCTION: false,
  },
};

const getArgs = () => {
  const name = BRANCH_OR_TAG_NAME;

  let buildType = "prod";

  if (name.includes("dev")) {
    buildType = "dev";
  } else if (name.includes("debug")) {
    buildType = "debug";
  } else if (name.includes("rc")) {
    buildType = "rc";
  }

  return { buildType, tagName: name };
};

const setConfig = async (buildType) => {
  const configPath = path.join(__dirname, "..", "cysync", "src", "config.json");
  const commitHash = await getCommitHash();
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        ...BUILD_TYPE_CONFIG[buildType],
        BUILD_VERSION: commitHash.slice(0, 7),
      },
      undefined,
      2
    ) + os.EOL
  );
};

const getCommitHash = () => {
  return new Promise((resolve, reject) => {
    childProcess.exec(
      'git log -n 1 --pretty=format:"%H"',
      (err, stdout, stderr) => {
        if (err || stderr) {
          reject(err || stderr);
          return;
        }

        resolve(stdout.trim());
      }
    );
  });
};

const setDependencies = () => {
  if (process.platform === "darwin") {
    const packageJsonPath = path.join(
      __dirname,
      "..",
      "cysync",
      "package.json"
    );
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));

    if (packageJson.hasOwnProperty("resolutions")) {
      packageJson.resolutions[
        "**/@electron-forge/maker-dmg/electron-installer-dmg/appdmg"
      ] = "^0.6.4";
    } else {
      packageJson.resolutions = {
        "**/@electron-forge/maker-dmg/electron-installer-dmg/appdmg": "^0.6.4",
      };
    }

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, undefined, 2) + os.EOL
    );
  }
};

const run = async () => {
  try {
    const { buildType } = getArgs();
    await setConfig(buildType);
    setDependencies();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
