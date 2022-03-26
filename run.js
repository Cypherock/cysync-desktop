/**
 * @fileoverview
 * Execute yarn scripts in the application or package directory from the project root.
 */

const { spawn } = require('child_process');
const { PACKAGES, getEnvCommand } = require('./build');

function main() {
  const commands = [];
  commands.push(getEnvCommand('NPM_AUTH', ''));
  commands.push(cmd);
  const unifiedCommand = commands.join(' && ').split(' ');

  if (dir === 'cysync') {
    spawn(unifiedCommand.shift(), unifiedCommand, {
      cwd: `${__dirname}/cysync`,
      stdio: 'inherit',
      shell: true
    });
    return;
  }

  if (PACKAGES.find(pkg => pkg.name === dir)) {
    spawn(commands.shift(), commands, {
      cwd: `${__dirname}/packages/${dir}`,
      stdio: 'inherit'
    });
    return;
  }

  if (dir === 'packages') {
    const individualCommands = [];
    PACKAGES.forEach(pkg => {
      individualCommands.push(getEnvCommand('NPM_AUTH', ''));
      individualCommands.push(`cd packages/${pkg.name}`);
      individualCommands.push(cmd);
      individualCommands.push('cd ../..');
    });
    const sequence = individualCommands.join(' && ').split(' ');
    spawn(sequence.shift(), sequence, {
      shell: true,
      stdio: 'inherit'
    });
    return;
  }

  if (dir === 'all') {
    const individualCommands = [];
    individualCommands.push('cd cysync');
    individualCommands.push(cmd);
    individualCommands.push('cd ..');
    PACKAGES.forEach(pkg => {
      individualCommands.push(`cd packages/${pkg.name}`);
      individualCommands.push(cmd);
      individualCommands.push('cd ../..');
    });
    const sequence = individualCommands.join(' && ').split(' ');
    spawn(sequence.shift(), sequence, {
      shell: true,
      stdio: 'inherit'
    });
    return;
  }
  console.error('ERR: Invalid or missing command. Aborting.');
  process.exit(1);
}

const args = process.argv.slice(2);

// Either a package name, 'cysync' or 'all'
const dir = args[0];

// A (yarn) script, e.g. "yarn dev"
const cmd = args[1];

main();
