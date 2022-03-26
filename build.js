/**
 * @fileoverview
 * This file is supposed to be in the project root, as it uses `__dirname` to
 * determine all paths.
 */

const fse = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');

const PACKAGES = [
  { name: 'communication', copyDeps: false },
  { name: 'server-wrapper', copyDeps: false },
  { name: 'database', copyDeps: true },
  { name: 'wallet', copyDeps: true },
  { name: 'protocols', copyDeps: true }
];

/**
 * @param dir - Directory to empty and create again.
 * @description Helper function to empty the specified directory.
 */
function resetDirectory(dir) {
  try {
    console.log(`[info] Deleting ${dir}...`);
    fse.rmSync(path.join(__dirname, dir), { recursive: true, force: true });
    fse.mkdirSync(path.join(__dirname, dir));
  } catch (err) {
    console.error(`[error] Trouble resetting directory "${dir}".`, err);
    process.exit(1);
  }
}

/**
 * @param source - First arg of `cp -r` (source file/directory to copy)
 * @param destination - Second arg of `cp -r` (target location of copied files)
 * @description Helper function to implement "cp -r" based on current OS.
 */
function copyRecursive(source, destination) {
  fse.copySync(source, destination, { overwrite: true, recursive: true });
}

/**
 * @param key   {string} Name of env variable to set
 * @param value {string} Environment variable value (without quotes)
 * @description Return a platform-specific command to set an environment variable.
 */
function getEnvCommand(key, value = '') {
  const envCommand =
    process.platform === 'win32'
      ? `set ${key}="${value}"`
      : `export ${key}="${value}"`;
  return envCommand;
}

/**
 * @param packageName - Directory name of package to remove (optional).
 * @description Remove specified package build, or all builds if nothing specified.
 */
function removePreviousBuild(packageName) {
  if (PACKAGES.find(pkg => pkg.name === packageName)) {
    resetDirectory(path.join(`@cypherock`, packageName));
    return;
  }
  PACKAGES.forEach(pkg => {
    resetDirectory(path.join('@cypherock', pkg.name));
  });
}

/**
 * @param arg {string} - Either a package name, or 'all'.
 * @description Build specified package, or 'all' packages.
 */
function build(arg) {
  if (arg === 'all') {
    removePreviousBuild();
    PACKAGES.forEach(pkg => {
      buildPackage(pkg.name, pkg.copyDeps);
    });
    return;
  }
  if (PACKAGES.find(pkg => pkg.name === arg)) {
    removePreviousBuild(arg);
    buildPackage(arg);
  } else {
    console.error('Invalid args to build command, aborting.');
    process.exit(1);
  }
}

/** Build the specified package */
function buildPackage(pkgName, copyDeps = false) {
  const packageDir = path.join(__dirname, 'packages', pkgName);
  console.log(`Building package "${pkgName}"...`);

  if (copyDeps) {
    fse.rmSync(path.join(packageDir, 'node_modules', '@cypherock'), {
      recursive: true,
      force: true
    });
    copyRecursive(
      '@cypherock',
      path.join(packageDir, 'node_modules', '@cypherock')
    );
  }

  const commands = [];
  commands.push(getEnvCommand('NPM_AUTH', ''));
  commands.push('yarn build');
  const unifiedCommand = commands.join(' && ').replace(/,/g, ' ');

  execSync(unifiedCommand, {
    cwd: packageDir,
    encoding: 'utf-8',
    stdio: 'inherit'
  });
  copyRecursive(
    path.join(packageDir, 'dist'),
    path.join('@cypherock', pkgName, 'dist')
  );
  fse.copyFileSync(
    path.join(packageDir, 'package.json'),
    path.join('@cypherock', pkgName, 'package.json')
  );
  console.log(`Done building package "${pkgName}"!`);
}

/**
 * @description Runs "yarn" inside cysync directory.
 */
function installDependencies() {
  const commands = [];
  commands.push(getEnvCommand('NPM_AUTH', ''));
  commands.push('cd cysync'.split(' '));
  commands.push('yarn --network-timeout 100000');
  commands.push('cd ..'.split(' '));
  const unifiedCommand = commands.join(' && ').replace(/,/g, ' ');
  const cmdSequence = unifiedCommand.split(' ');
  spawn(cmdSequence.shift(), cmdSequence, {
    shell: true,
    stdio: 'inherit'
  });
}

/**
 * @description Run "yarn" inside all packages.
 */
function installPackageDependencies() {
  const commands = [];
  commands.push(getEnvCommand('NPM_AUTH', ''));
  PACKAGES.forEach(pkg => {
    commands.push(`cd packages/${pkg.name}`.split(' '));
    commands.push('yarn --network-timeout 100000');
    commands.push('cd ../..'.split(' '));
  });
  const unifiedCommand = commands.join(' && ').replace(/,/g, ' ');
  const cmdSequence = unifiedCommand.split(' ');
  spawn(cmdSequence.shift(), cmdSequence, {
    shell: true,
    stdio: 'inherit'
  });
}

/** Rewrite all package builds to `cysync/app` */
function copyToDesktop() {
  const appDir = path.join(__dirname, 'cysync');
  console.log('Copying to desktop...');
  fse.rmSync(path.join(appDir, 'node_modules', '@cypherock'), {
    recursive: true,
    force: true
  });
  copyRecursive('@cypherock', path.join(appDir, 'node_modules', '@cypherock'));
  console.log('Done copying to desktop!');
}

/**
 * Calling process.exit() kills all ongoing async tasks.
 * To avoid using process.exit() to exit script, everything is wrapped inside
 * main() so that a `return` can exit the program.
 */
function main() {
  const args = process.argv.slice(2);

  if (!fse.existsSync('@cypherock')) fse.mkdirSync('@cypherock');

  args.forEach(arg => {
    build(arg);
  });

  if (args.length > 0) copyToDesktop();
  else {
    console.error('[FAIL] No arguments specified, aborting.');
  }
}

if (require.main === module) main();

module.exports = {
  PACKAGES,
  getEnvCommand
};
