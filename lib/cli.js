#!/usr/bin/env node
//
// Benchoid CLI entry point.
//
const _ = require('lodash')
const commands = require('./commands')

function main() {
  const args = process.argv.slice(2)
  const cmdName = _.toString(_.first(args))
    .toLowerCase()
    .trim()

  if (!cmdName) {
    console.error('Usage: benchoid <command name> [options]')
    console.error('Use "benchoid <command> --help" for help.')
    console.error(`Available commands: ${_.keys(commands).join(', ')}`)    
    return process.exit(1)
  }

  if (!commands[cmdName]) {
    console.error(`Error: command "${cmdName}" not found.`)
    console.error(`Available commands: ${_.keys(commands).join(', ')}`)
    return process.exit(1)
  }

  commands[cmdName](args.slice(1))
    .then(() => process.exit(0))
    .catch(exc => {
      console.error(exc)
      return process.exit(1)
    })
}

if (require.main === module) {
  main()
} else {
  module.exports = main
}
