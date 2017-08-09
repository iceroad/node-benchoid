#!/usr/bin/env node
//
// Benchoid CLI entry point.
//
const _ = require('lodash'),
  commands = require('./commands'),
  clog = require('./util/clog'),
  minimist = require('minimist'),
  packageJson = require('../package.json'),
  path = require('path'),
  setupCLI = require('./util/setupCLI'),
  version = require('./util/version')
  ;


function main(args) {
  try {
    args = setupCLI('benchoid', packageJson, commands, args);
    clog.enable();
  } catch (e) {
    console.error(e.message);
    return process.exit(1);
  }

  const cmdName = (args._[0] || '').toLowerCase().trim();
  const cmd = commands[cmdName];
  if (!cmd) {
    console.error(`Invalid command "${cmdName}"`);
    return process.exit(1);
  }

  require(path.resolve(__dirname, 'commands', cmdName))(args);
}


if (require.main === module) {
  main(minimist(process.argv.slice(2)));
} else {
  module.exports = main;
}
