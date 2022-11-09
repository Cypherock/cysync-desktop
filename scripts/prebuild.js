const axios = require("axios");
const path = require("path");
const fs = require("fs");
const os = require("os");
const childProcess = require("child_process");

const BRANCH_OR_TAG_NAME = process.env.GITHUB_REF_NAME;
const GITHUB_BASE_API = "https://api.github.com";
const GITHUB_ACCESS_TOKEN = process.env.GH_ACCESS_TOKEN;
const DEV_ANALYTICS_KEY = process.env.DEV_ANALYTICS_KEY;
const PROD_ANALYTICS_KEY = process.env.PROD_ANALYTICS_KEY;

const RELEASE_FILE_NAME = "RELEASES.txt";

console.log({ BRANCH_OR_TAG_NAME });

if (!DEV_ANALYTICS_KEY || !PROD_ANALYTICS_KEY) {
  throw new Error("Analytics keys are not defined in environment");
}

const BUILD_TYPE_CONFIG = {
  dev: {
    BUILD_TYPE: "debug",
    LOG_LEVEL: "silly",
    SERVER_ENV: "development",
    GITHUB_REPO: "Cypherock/cysync-desktop-dev",
    ALLOW_PRERELEASE: false,
    SIMULATE_PRODUCTION: false,
  },
  feat: {
    BUILD_TYPE: "debug",
    LOG_LEVEL: "silly",
    SERVER_ENV: "development",
    GITHUB_REPO: "Cypherock/cysync-desktop-feat",
    ALLOW_PRERELEASE: true,
    SIMULATE_PRODUCTION: false,
    ANALYTICS_KEY: DEV_ANALYTICS_KEY,
  },
  debug: {
    BUILD_TYPE: "production",
    LOG_LEVEL: "silly",
    SERVER_ENV: "production",
    GITHUB_REPO: "Cypherock/cysync-desktop-debug",
    ALLOW_PRERELEASE: true,
    SIMULATE_PRODUCTION: false,
    ANALYTICS_KEY: DEV_ANALYTICS_KEY,
  },
  rc: {
    BUILD_TYPE: "production",
    LOG_LEVEL: "info",
    SERVER_ENV: "production",
    GITHUB_REPO: "Cypherock/cysync-desktop-rc",
    ALLOW_PRERELEASE: false,
    SIMULATE_PRODUCTION: false,
    ANALYTICS_KEY: DEV_ANALYTICS_KEY,
  },
  prod: {
    BUILD_TYPE: "production",
    LOG_LEVEL: "info",
    SERVER_ENV: "production",
    GITHUB_REPO: "Cypherock/cysync-desktop",
    ALLOW_PRERELEASE: false,
    SIMULATE_PRODUCTION: false,
    ANALYTICS_KEY: PROD_ANALYTICS_KEY,
  },
};

const getArgs = () => {
  const name = BRANCH_OR_TAG_NAME;

  let buildType = "prod";

  if (name.includes("dev")) {
    buildType = "dev";
  } else if (name.includes("feat")) {
    buildType = "feat";
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

// Gets the previos version and determines the next index
const getReleaseIndex = async ({ githubRepo }) => {
  let previousFileContent = "";

  const packageJsonPath = path.join(__dirname, "..", "cysync", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));

  try {
    const fileContentResp = await axios.get(
      `${GITHUB_BASE_API}/repos/${githubRepo}/contents/${RELEASE_FILE_NAME}`,
      { headers: { Authorization: `token ${GITHUB_ACCESS_TOKEN}` } }
    );

    if (!fileContentResp?.data?.content) {
      throw new Error("Cannot find file content");
    }
    previousFileContent = Buffer.from(fileContentResp.data.content, "base64")
      .toString()
      .trim();
    sha = fileContentResp.data.sha;
  } catch (error) {
    if (error?.response?.status !== 404) {
      throw error;
    }
  }

  let currentIndex = 1;

  if (previousFileContent) {
    const contentArr = previousFileContent.split("\n");
    if (contentArr.length > 0) {
      const version = contentArr[0];
      const versionArr = version.split("-");
      if (versionArr.length !== 2) {
        throw new Error("Invalid version " + version);
      }

      const baseVersion = versionArr[0];
      if (versionArr[1].split(".").length !== 2) {
        throw new Error("Invalid version " + version);
      }

      if (baseVersion === packageJson.version) {
        const index = versionArr[1].split(".")[1].trim();
        if (!index || isNaN(index)) {
          throw new Error("Invalid version " + version);
        }

        currentIndex = parseInt(index, 10) + 1;
      }
    }
  }

  return currentIndex;
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

  const index = ["dev","feat","debug"].includes(buildType)
    ? await getReleaseIndex({
        githubRepo: BUILD_TYPE_CONFIG[buildType].GITHUB_REPO,
      })
    : 1;

  switch (buildType) {
    case "dev":
      packageJson.version = `${usableVersion}-dev.${index}`;
      break;
    case "feat":
      packageJson.version = `${usableVersion}-feat.${index}`;
      break;
    case "debug":
      packageJson.version = `${usableVersion}-debug.${index}`;
      break;
    case "rc":
      let newName = tagName;
      if (newName.startsWith("v")) {
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
    const { buildType, tagName } = getArgs();
    console.log({ buildType });
    await setConfig(buildType);
    setDependencies();
    await setVersion(buildType, tagName);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
