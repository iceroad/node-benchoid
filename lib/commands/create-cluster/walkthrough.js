const inquirer = require('inquirer')

function walkthrough(config) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'region',
      message: 'AWS region',
      default: config.region || 'us-east-1',
    },
    {
      type: 'input',
      name: 'az',
      message: 'Availability zone within region',
      default: config.az || 'us-east-1c',
    },
    {
      type: 'input',
      name: 'instanceType',
      message: 'EC2 instance type to use for clients',
      default: config.instanceType || 't2.small',
    },
    {
      type: 'input',
      name: 'instanceCount',
      message: 'Number of EC2 instances to use for the client tier.',
      default: config.instanceCount || 2,
    },
    {
      type: 'input',
      name: 'baseAmiSearchTerm',
      message: 'Base AMI search term',
      default: config.baseAmiSearchTerm || 'ubuntu/images/hvm-ssd/ubuntu-xenial-16.04-amd64-server-*',
    },
  ])
}

module.exports = walkthrough
