const inquirer = require('inquirer')

function walkthrough(args) {
  const d = new Date()

  const questions = [
    {
      type: 'input',
      name: 'runName',
      message: 'Name for this run',
      default: args.runName || d.toISOString().replace(/\..*$/, ''),
    },
    {
      type: 'input',
      name: 'runDesc',
      message: 'Run title',
    },
    {
      type: 'input',
      name: 'numAgents',
      message: 'Number of agents per client',
      default: args.numAgents || 100,
    },
    {
      type: 'input',
      name: 'warmup',
      message: 'Warmup time to spin up agents (in milliseconds)',
      default: args.warmup || 30 * 1000,
    },
    {
      type: 'input',
      name: 'steady',
      message: 'Steady-state time to keep all agents running (in milliseconds)',
      default: args.steady || 3 * 60 * 1000, // 3 minutes
    },
  ]

  return inquirer.prompt(questions)
}

module.exports = walkthrough
