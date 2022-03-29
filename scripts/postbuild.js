const axios = require("axios");
const path = require("path");
const fs = require("fs");

const GITHUB_BASE_API = "https://api.github.com";
const GITHUB_ACCESS_TOKEN = process.env.GH_ACCESS_TOKEN;
const BRANCH_OR_TAG = process.env.GITHUB_REF_TYPE;
const BRANCH_OR_TAG_NAME = process.env.GITHUB_REF_NAME;

const CONTENT_TYPE_MAP = {
  ".dmg": "application/x-apple-diskimage",
  ".exe": "application/x-msdownload",
  ".AppImage": "application/vnd.appimage",
  ".yml": "application/x-yaml",
  ".msi": "application/x-msi",
  ".deb": "application/vnd.debian.binary-package",
};

const getArgs = () => {
  const CMD_ERROR_MSG =
    "Invalid command. Expected command: `node <file_name>.js <folder1,folder2...>`";

  const args = process.argv.slice(2);

  if (args.length !== 1) {
    throw new Error(CMD_ERROR_MSG);
  }

  const branchOrTag = BRANCH_OR_TAG;
  const name = BRANCH_OR_TAG_NAME;

  let buildType = "prod";
  const foldernames = args[1];

  if (!["branch", "tag"].includes(branchOrTag)) {
    throw new Error("Invalid `GITHUB_REF_TYPE`: " + branchOrTag);
  }

  if (branchOrTag === "branch") {
    if (!["dev", "debug"].includes(name)) {
      throw new Error("Invalid `GITHUB_REF_NAME`: " + name);
    }

    buildType = name;
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

const getReleaseName = (version) => {
  return `v${version}`;
};

const createRelease = async ({ version, githubRepo, tagName, buildType }) => {
  const releaseName = getReleaseName(version);

  const postData = {
    tag_name: releaseName,
    name: releaseName,
  };

  if (buildType === "prod") {
    postData.tag_name = tagName;
    postData.name = tagName;
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
