const axios = require("axios");
const path = require("path");
const fs = require("fs");

const GITHUB_BASE_API = "https://api.github.com";
const GITHUB_ACCESS_TOKEN = process.env.GH_ACCESS_TOKEN;
const BRANCH_OR_TAG_NAME = process.env.GITHUB_REF_NAME;

const CONTENT_TYPE_MAP = {
  ".dmg": "application/x-apple-diskimage",
  ".exe": "application/x-msdownload",
  ".AppImage": "application/vnd.appimage",
  ".yml": "application/x-yaml",
  ".msi": "application/x-msi",
  ".deb": "application/vnd.debian.binary-package",
};

const RELEASE_FILE_NAME = "RELEASES.txt";

const getArgs = () => {
  const CMD_ERROR_MSG =
    "Invalid command. Expected command: `node <file_name>.js <folder1,folder2...>`";

  const args = process.argv.slice(2);

  if (args.length !== 1) {
    throw new Error(CMD_ERROR_MSG);
  }

  const name = BRANCH_OR_TAG_NAME;

  let buildType = "prod";
  const foldernames = args[0];

  if (name.includes("dev")) {
    buildType = "dev";
  } else if (name.includes("feat")) {
    buildType = "feat";
  } else if (name.includes("debug")) {
    buildType = "debug";
  } else if (name.includes("rc")) {
    buildType = "rc";
  }

  return { buildType, tagName: name, assetFolders: foldernames.split(",") };
};

const getVersion = async () => {
  const packageJsonPath = path.join(__dirname, "..", "cysync", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));

  return packageJson.version;
};

const getGithubRepo = async () => {
  const configPath = path.join(__dirname, "..", "cysync", "src", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath));

  return config.GITHUB_REPO;
};

const getBuildVersion = async () => {
  const configPath = path.join(__dirname, "..", "cysync", "src", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath));

  return config.BUILD_VERSION;
};

const getReleaseName = (version) => {
  return `v${version}`;
};

/*
 * Updating a file intentionally to add a new commit every time a new version is
 * released.
 */
const updateReleaseFile = async ({ releaseName, githubRepo, version }) => {
  let previousFileContent = "";
  let sha = "";

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

  let fileContent = `${version}`;

  const postData = {
    content: Buffer.from(fileContent, "utf-8").toString("base64"),
    message: `Added release ${releaseName}`,
  };

  if (sha) {
    postData.sha = sha;
  }

  await axios.put(
    `${GITHUB_BASE_API}/repos/${githubRepo}/contents/${RELEASE_FILE_NAME}`,
    postData,
    { headers: { Authorization: `token ${GITHUB_ACCESS_TOKEN}` } }
  );
};

const createRelease = async ({ version, githubRepo, tagName, buildType }) => {
  const releaseName = getReleaseName(version);

  const buildVersion = await getBuildVersion();
  const postData = {
    tag_name: releaseName,
    name: releaseName,
    body: `Build Version: ${buildVersion}`,
  };

  if (["prod", "rc"].includes(buildType)) {
    postData.tag_name = tagName;
    postData.name = tagName;
  }

  // Only add releases file to non prod repos
  if (buildType !== "prod") {
    await updateReleaseFile({
      releaseName: postData.name,
      githubRepo,
      version,
    });
  }

  const resp = await axios.post(
    `${GITHUB_BASE_API}/repos/${githubRepo}/releases`,
    postData,
    { headers: { Authorization: `token ${GITHUB_ACCESS_TOKEN}` } }
  );

  return resp.data.upload_url.replace("{?name,label}", "");
};

const walk = (directoryName) => {
  const allFiles = [];
  const files = fs.readdirSync(directoryName);
  for (const file of files) {
    var fullPath = path.join(directoryName, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      allFiles.push(...walk(fullPath));
    } else {
      allFiles.push(fullPath);
    }
  }

  return allFiles;
};

const uploadAllAssets = async (uploadUrl, assetFolders) => {
  let allAssets = [];
  for (const folder of assetFolders) {
    allAssets.push(...walk(path.join(__dirname, "..", folder)));
  }

  for (const asset of allAssets) {
    const fileExt = path.extname(asset);
    const contentType = CONTENT_TYPE_MAP[fileExt] || "application/octet-stream";
    const filename = path.basename(asset);

    console.log(`Uploading ${asset}...`);
    await axios.post(`${uploadUrl}?name=${filename}`, fs.readFileSync(asset), {
      headers: {
        "Content-Type": contentType,

        Authorization: `token ${GITHUB_ACCESS_TOKEN}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    console.log(`Uploaded ${asset}\n`);
  }
};

const run = async () => {
  try {
    const { buildType, tagName, assetFolders } = getArgs();
    const version = await getVersion();
    const githubRepo = await getGithubRepo();

    const uploadUrl = await createRelease({
      version,
      githubRepo,
      tagName,
      buildType,
    });

    await uploadAllAssets(uploadUrl, assetFolders);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
