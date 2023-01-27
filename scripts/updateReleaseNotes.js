const os = require("os");
const fs = require("fs");
const path = require("path");

const RELEASE_NOTES_MARKDOWN = "RELEASE_NOTES.md";
const RELEASE_NOTES_JSON = "release_notes.json";

const setReleaseNotes = () => {
  if (process.platform === "darwin") {
    const releaseNotesPath = path.join(
      __dirname,
      "..",
      "cysync",
      RELEASE_NOTES_MARKDOWN
    );
    const releaseNotesJsonPath = path.join(
      __dirname,
      "..",
      "cysync",
      RELEASE_NOTES_JSON
    );
    const releaseNotesContent = fs.readFileSync(releaseNotesPath).toString();

    fs.writeFileSync(
      releaseNotesJsonPath,
      JSON.stringify({ notes: releaseNotesContent }, undefined, 2) + os.EOL
    );
  }
};

const run = async () => {
  try {
    setReleaseNotes();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
