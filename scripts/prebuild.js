const path = require("path");
const fs = require("fs");
const os = require("os");
const childProcess = require("child_process");

const BRANCH_OR_TAG = process.env.GITHUB_REF_TYPE;
const BRANCH_OR_TAG_NAME = process.env.GITHUB_REF_NAME;

const BUILD_TYPE_CONFIG = {
  dev: {
    BUILD_TYPE: "debug",
    LOG_LEVEL: "silly",
    SERVER_ENV: "development",
    GITHUB_REPO: "Cypherock/cysync-desktop-dev",
    SIMULATE_PRODUCTION: false,
  },
  debug: {
    BUILD_TYPE: "debug",
    LOG_LEVEL: "silly",
    SERVER_ENV: "production",
    GITHUB_REPO: "Cypherock/cysync-desktop-debug",
    SIMULATE_PRODUCTION: false,
  },
  rc: {
    BUILD_TYPE: "production",
    LOG_LEVEL: "info",
    SERVER_ENV: "production",
    GITHUB_REPO: "Cypherock/cysync-desktop-rc",
    SIMULATE_PRODUCTION: false,
  },
  prod: {
    BUILD_TYPE: "production",
    LOG_LEVEL: "info",
    SERVER_ENV: "production",
    GITHUB_REPO: "Cypherock/cysync-desktop",
    SIMULATE_PRODUCTION: false,
  },
};

const getArgs = () => {
  const branchOrTag = BRANCH_OR_TAG;
  const name = BRANCH_OR_TAG_NAME;

  let buildType = "prod";

  if (!["branch", "tag"].includes(branchOrTag)) {
    throw new Error("Invalid `GITHUB_REF_TYPE`: " + branchOrTag);
  }

  if (branchOrTag === "branch") {
    if (!["dev", "debug"].includes(name)) {
      throw new Error("Invalid `GITHUB_REF_NAME`: " + name);
    }

    buildType = name;
  } else if (name.includes("rc")) {
    buildType = "rc";
  }

  return { buildType, tagName: name };
};

const setConfig = (buildType) => {
  const configPath = path.join(__dirname, "..", "cysync", "src", "config.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify(BUILD_TYPE_CONFIG[buildType], undefined, 2) + os.EOL
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

const setVersion = async (buildType, tagName) => {
  const packageJsonPath = path.join(__dirname, "..", "cysync", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));

  const version = packageJson.version;
  if (!version && version.split(".").length !== 3) {
    throw new Error("Invalid version in package json");
  }

  const versionArr = version.split(".");
  if (versionArr.length < 3) {
    throw new Error("Invalid version in package json");
  }

  const usableVersionArr = [];
  for (const v of versionArr) {
    if (v.includes("-") || Number.isNaN(v)) {
      throw new Error("Invalid version in package json");
    }

    usableVersionArr.push(v);
    if (usableVersionArr.length === 3) break;
  }

  const usableVersion = usableVersionArr.join(".");
  const commitHash = await getCommitHash();

  switch (buildType) {
    case "dev":
      packageJson.version = `${usableVersion}-dev.${commitHash.slice(0, 6)}`;
      break;
    case "debug":
      packageJson.version = `${usableVersion}-debug.${commitHash.slice(0, 6)}`;
      break;
    case "rc":
      let newName = tagName;
      if (newName.startsWith('v')) {
        newName = newName.slice(1);
      }
      packageJson.version = newName;
      break;
    case "prod":
    default:
      packageJson.version = usableVersion;
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2));
};

const setDependencies = () => {
  if (process.platform === "darwin") {
    const packageJsonPath = path.join(__dirname, "..", "cysync", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));

    if (packageJson.hasOwnProperty("resolutions")) {
      packageJson.resolutions["**/@electron-forge/maker-dmg/electron-installer-dmg/appdmg"] = "^0.6.4";
    } else {
      packageJson.resolutions = {
        "**/@electron-forge/maker-dmg/electron-installer-dmg/appdmg": "^0.6.4"
      };
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2) + os.EOL);
  }
}

const run = async () => {
  try {
    const { buildType, tagName } = getArgs();
    setConfig(buildType);
    await setVersion(buildType, tagName);
    setDependencies();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
