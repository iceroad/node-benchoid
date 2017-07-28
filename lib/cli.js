#!/usr/bin/env node
//
// Benchoid CLI entry point.
//
const _ = require('lodash'),
  clog = require('./util/clog'),
  minimist = require('minimist'),
  version = require('./util/version'),
  Commands = require('./commands')
  ;


function main(args) {
  if (args.version || args.v) {
    console.log(`benchoid ${version('benchoid')}`);
    return process.exit(0);
  }

  const cmdName = _.first(args._);
  if (!cmdName) {
    console.error('Usage: benchoid <command>');
    return process.exit(1);
  }

  const cmd = Commands[cmdName];
  if (!_.isFunction(cmd)) {
    console.error(`Invalid command "${cmdName}"`);
    return process.exit(1);
  }

  clog.enable();
  return cmd(args);
}


if (require.main === module) {
  main(minimist(process.argv.slice(2)));
} else {
  module.exports = main;
}
