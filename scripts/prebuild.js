const axios = require("axios");
const path = require("path");
const fs = require("fs");
const os = require("os");
const childProcess = require("child_process");

const GITHUB_BASE_API = "https://api.github.com";
const GITHUB_ACCESS_TOKEN = process.env.GH_ACCESS_TOKEN;

const BRANCH_OR_TAG = process.env.GITHUB_REF_TYPE;
const BRANCH_OR_TAG_NAME = process.env.GITHUB_REF_NAME;

const RELEASE_FILE_NAME = "RELEASES.txt";

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

  const index = ["dev", "debug"].includes(buildType)
    ? await getReleaseIndex({
        githubRepo: BUILD_TYPE_CONFIG[buildType].GITHUB_REPO,
      })
    : 1;

  switch (buildType) {
    case "dev":
      packageJson.version = `${usableVersion}-dev.${index}`;
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
    await setConfig(buildType);
    await setVersion(buildType, tagName);
    setDependencies();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
